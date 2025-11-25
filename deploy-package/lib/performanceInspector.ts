import sql from "mssql";

export type PerformanceMetrics = {
  indexEfficiency: number;
  queryPerformanceScore: number;
  fragmentationScore: number;
  memoryUsageScore: number;
  overallPerformanceScore: number;
  missingIndexes: number;
  unusedIndexes: number;
  fragmentedIndexes: number;
  slowQueries: number;
  totalQueries: number;
  avgQueryTime: number;
  maxQueryTime: number;
};

export type IndexInfo = {
  tableName: string;
  indexName: string;
  indexType: string;
  isUnique: boolean;
  isPrimaryKey: boolean;
  fragmentationPercent: number;
  pageCount: number;
  userSeeks: number;
  userScans: number;
  userLookups: number;
  userUpdates: number;
  lastUserSeek: Date | null;
  sizeMB: number;
  efficiency: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNUSED';
};

export type QueryPerformanceInfo = {
  queryText: string;
  executionCount: number;
  avgExecutionTime: number;
  totalExecutionTime: number;
  avgCpuTime: number;
  avgLogicalReads: number;
  creationTime: Date;
  lastExecutionTime: Date;
  performanceClass: 'FAST' | 'MEDIUM' | 'SLOW' | 'CRITICAL';
};

export async function inspectPerformance(pool: sql.ConnectionPool): Promise<{
  performanceMetrics: PerformanceMetrics;
  indexAnalysis: IndexInfo[];
  queryPerformance: QueryPerformanceInfo[];
  recommendations: string[];
}> {
  
  // Análise de índices
  const indexAnalysis = await analyzeIndexes(pool);
  
  // Análise de queries
  const queryPerformance = await analyzeQueryPerformance(pool);
  
  // Métricas gerais
  const performanceMetrics = await computePerformanceMetrics(pool, indexAnalysis, queryPerformance);
  
  // Recomendações
  const recommendations = generatePerformanceRecommendations(indexAnalysis, queryPerformance);

  return {
    performanceMetrics,
    indexAnalysis,
    queryPerformance,
    recommendations
  };
}

async function analyzeIndexes(pool: sql.ConnectionPool): Promise<IndexInfo[]> {
  const result = await pool.request().query(`
    SELECT 
      t.name AS table_name,
      i.name AS index_name,
      i.type_desc AS index_type,
      i.is_unique,
      i.is_primary_key,
      ips.avg_fragmentation_in_percent AS fragmentation_percent,
      ips.page_count,
      ius.user_seeks,
      ius.user_scans,
      ius.user_lookups,
      ius.user_updates,
      ius.last_user_seek,
      (ips.page_count * 8.0) / 1024.0 AS size_mb
    FROM sys.tables t
    INNER JOIN sys.indexes i ON t.object_id = i.object_id
    INNER JOIN sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'DETAILED') ips
      ON i.object_id = ips.object_id AND i.index_id = ips.index_id
    LEFT JOIN sys.dm_db_index_usage_stats ius
      ON i.object_id = ius.object_id AND i.index_id = ius.index_id AND ius.database_id = DB_ID()
    WHERE t.is_ms_shipped = 0
      AND i.type_desc IN ('CLUSTERED', 'NONCLUSTERED')
    ORDER BY ips.avg_fragmentation_in_percent DESC, ius.user_seeks + ius.user_scans + ius.user_lookups DESC
  `);

  return result.recordset.map((row: any) => {
    const totalUsage = (row.user_seeks || 0) + (row.user_scans || 0) + (row.user_lookups || 0);
    const efficiency = calculateIndexEfficiency(
      totalUsage,
      row.user_updates || 0,
      row.fragmentation_percent || 0,
      row.page_count || 0
    );

    return {
      tableName: row.table_name,
      indexName: row.index_name,
      indexType: row.index_type,
      isUnique: row.is_unique,
      isPrimaryKey: row.is_primary_key,
      fragmentationPercent: row.fragmentation_percent || 0,
      pageCount: row.page_count || 0,
      userSeeks: row.user_seeks || 0,
      userScans: row.user_scans || 0,
      userLookups: row.user_lookups || 0,
      userUpdates: row.user_updates || 0,
      lastUserSeek: row.last_user_seek,
      sizeMB: row.size_mb || 0,
      efficiency
    };
  });
}

function calculateIndexEfficiency(
  usage: number, 
  updates: number, 
  fragmentation: number, 
  pages: number
): 'HIGH' | 'MEDIUM' | 'LOW' | 'UNUSED' {
  if (usage === 0) return 'UNUSED';
  if (fragmentation > 30) return 'LOW';
  if (usage > updates * 2 && fragmentation < 10) return 'HIGH';
  if (usage > updates && fragmentation < 20) return 'MEDIUM';
  return 'LOW';
}

async function analyzeQueryPerformance(pool: sql.ConnectionPool): Promise<QueryPerformanceInfo[]> {
  const result = await pool.request().query(`
    SELECT TOP 50
      st.text AS query_text,
      qs.execution_count,
      qs.avg_elapsed_time / 1000.0 AS avg_execution_time_ms,
      qs.total_elapsed_time / 1000.0 AS total_execution_time_ms,
      qs.avg_worker_time / 1000.0 AS avg_cpu_time_ms,
      qs.avg_logical_reads,
      qs.creation_time,
      qs.last_execution_time,
      CASE 
        WHEN qs.avg_elapsed_time < 100000 THEN 'FAST'
        WHEN qs.avg_elapsed_time < 1000000 THEN 'MEDIUM'
        WHEN qs.avg_elapsed_time < 5000000 THEN 'SLOW'
        ELSE 'CRITICAL'
      END AS performance_class
    FROM sys.dm_exec_query_stats qs
    CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
    WHERE st.text IS NOT NULL
      AND st.text NOT LIKE '%sys.%'
    ORDER BY qs.avg_elapsed_time DESC
  `);

  return result.recordset.map((row: any) => ({
    queryText: row.query_text.substring(0, 500), // Limit text
    executionCount: row.execution_count,
    avgExecutionTime: row.avg_execution_time_ms,
    totalExecutionTime: row.total_execution_time_ms,
    avgCpuTime: row.avg_cpu_time_ms,
    avgLogicalReads: row.avg_logical_reads,
    creationTime: row.creation_time,
    lastExecutionTime: row.last_execution_time,
    performanceClass: row.performance_class
  }));
}

async function computePerformanceMetrics(
  pool: sql.ConnectionPool,
  indexAnalysis: IndexInfo[],
  queryPerformance: QueryPerformanceInfo[]
): Promise<PerformanceMetrics> {
  
  // Métricas de índices
  const missingIndexes = await getMissingIndexes(pool);
  const unusedIndexes = indexAnalysis.filter(idx => idx.efficiency === 'UNUSED').length;
  const fragmentedIndexes = indexAnalysis.filter(idx => idx.fragmentationPercent > 30).length;
  
  // Métricas de queries
  const slowQueries = queryPerformance.filter(q => q.performanceClass === 'SLOW' || q.performanceClass === 'CRITICAL').length;
  const totalQueries = queryPerformance.length;
  const avgQueryTime = totalQueries > 0 ? queryPerformance.reduce((sum, q) => sum + q.avgExecutionTime, 0) / totalQueries : 0;
  const maxQueryTime = totalQueries > 0 ? Math.max(...queryPerformance.map(q => q.avgExecutionTime)) : 0;
  
  // Scores calculados
  const indexEfficiency = calculateIndexEfficiencyScore(indexAnalysis);
  const queryPerformanceScore = calculateQueryPerformanceScore(queryPerformance);
  const fragmentationScore = calculateFragmentationScore(indexAnalysis);
  const memoryUsageScore = await calculateMemoryUsageScore(pool);

  const overallScore = Math.round(
    (indexEfficiency + queryPerformanceScore + fragmentationScore + memoryUsageScore) / 4
  );

  return {
    indexEfficiency,
    queryPerformanceScore,
    fragmentationScore,
    memoryUsageScore,
    overallPerformanceScore: overallScore,
    missingIndexes,
    unusedIndexes,
    fragmentedIndexes,
    slowQueries,
    totalQueries,
    avgQueryTime: Math.round(avgQueryTime * 100) / 100,
    maxQueryTime: Math.round(maxQueryTime * 100) / 100
  };
}

async function getMissingIndexes(pool: sql.ConnectionPool): Promise<number> {
  const result = await pool.request().query(`
    SELECT COUNT(*) AS missing_index_count
    FROM sys.dm_db_missing_index_details mid
    INNER JOIN sys.dm_db_missing_index_groups mig ON mid.index_handle = mig.index_handle
    INNER JOIN sys.dm_db_missing_index_group_stats migs ON mig.index_group_handle = migs.group_handle
  `);

  return result.recordset[0]?.missing_index_count || 0;
}

function calculateIndexEfficiencyScore(indexAnalysis: IndexInfo[]): number {
  if (indexAnalysis.length === 0) return 100;
  
  const highEfficiency = indexAnalysis.filter(idx => idx.efficiency === 'HIGH').length;
  const totalUsableIndexes = indexAnalysis.filter(idx => idx.efficiency !== 'UNUSED').length;
  
  if (totalUsableIndexes === 0) return 0;
  
  return Math.round((highEfficiency / totalUsableIndexes) * 100);
}

function calculateQueryPerformanceScore(queryPerformance: QueryPerformanceInfo[]): number {
  if (queryPerformance.length === 0) return 100;
  
  const fastQueries = queryPerformance.filter(q => q.performanceClass === 'FAST').length;
  const criticalQueries = queryPerformance.filter(q => q.performanceClass === 'CRITICAL').length;
  
  const baseScore = (fastQueries / queryPerformance.length) * 100;
  const penalty = (criticalQueries / queryPerformance.length) * 50;
  
  return Math.max(0, Math.round(baseScore - penalty));
}

function calculateFragmentationScore(indexAnalysis: IndexInfo[]): number {
  if (indexAnalysis.length === 0) return 100;
  
  const totalFragmentation = indexAnalysis.reduce((sum, idx) => sum + idx.fragmentationPercent, 0);
  const avgFragmentation = totalFragmentation / indexAnalysis.length;
  
  return Math.max(0, Math.round(100 - avgFragmentation));
}

async function calculateMemoryUsageScore(pool: sql.ConnectionPool): Promise<number> {
  try {
    const result = await pool.request().query(`
      SELECT 
        (physical_memory_in_use_kb / 1024.0) AS memory_usage_mb,
        (locked_page_allocations_kb / 1024.0) AS locked_pages_mb,
        (virtual_address_space_committed_kb / 1024.0) AS vas_committed_mb
      FROM sys.dm_os_process_memory
    `);

    const memoryData = result.recordset[0];
    if (!memoryData) return 50;

    // Score baseado no uso de memória (simplificado)
    const memoryUsageMB = memoryData.memory_usage_mb || 0;
    
    // Considera uso de memória < 2GB como excelente, > 8GB como crítico
    if (memoryUsageMB < 2048) return 100;
    if (memoryUsageMB > 8192) return 20;
    
    // Interpolação linear entre 2GB e 8GB
    return Math.round(100 - ((memoryUsageMB - 2048) / (8192 - 2048)) * 80);
  } catch (error) {
    console.error('Erro ao calcular score de memória:', error);
    return 50;
  }
}

function generatePerformanceRecommendations(
  indexAnalysis: IndexInfo[],
  queryPerformance: QueryPerformanceInfo[]
): string[] {
  const recommendations: string[] = [];

  // Recomendações de índices
  const highFragmentationIndexes = indexAnalysis.filter(idx => idx.fragmentationPercent > 30);
  if (highFragmentationIndexes.length > 0) {
    recommendations.push(`Reorganizar ou recriar ${highFragmentationIndexes.length} índices com alta fragmentação (>30%)`);
  }

  const unusedIndexes = indexAnalysis.filter(idx => idx.efficiency === 'UNUSED');
  if (unusedIndexes.length > 0) {
    recommendations.push(`Considerar remoção de ${unusedIndexes.length} índices não utilizados para economizar espaço`);
  }

  // Recomendações de queries
  const criticalQueries = queryPerformance.filter(q => q.performanceClass === 'CRITICAL');
  if (criticalQueries.length > 0) {
    recommendations.push(`Revisar ${criticalQueries.length} queries críticas que consomem mais de 5 segundos em média`);
  }

  const slowQueries = queryPerformance.filter(q => q.performanceClass === 'SLOW');
  if (slowQueries.length > 0) {
    recommendations.push(`Otimizar ${slowQueries.length} queries lentas (1-5 segundos)`);
  }

  // Recomendações gerais
  const avgExecutionTime = queryPerformance.length > 0 
    ? queryPerformance.reduce((sum, q) => sum + q.avgExecutionTime, 0) / queryPerformance.length 
    : 0;

  if (avgExecutionTime > 1000) {
    recommendations.push('Considerar revisão geral de performance - tempo médio de execução elevado');
  }

  return recommendations;
}