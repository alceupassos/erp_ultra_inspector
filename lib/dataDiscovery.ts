import sql from "mssql";

export type DataDiscoveryResult = {
  dataQualityScore: number;
  completenessScore: number;
  consistencyScore: number;
  uniquenessScore: number;
  accuracyScore: number;
  totalAnomalies: number;
  dataPatterns: DataPattern[];
  qualityIssues: QualityIssue[];
  businessRules: BusinessRule[];
  recommendations: string[];
};

export type DataPattern = {
  tableName: string;
  columnName: string;
  patternType: 'EMAIL' | 'PHONE' | 'CPF' | 'CNPJ' | 'DATE' | 'CURRENCY' | 'PERCENTAGE' | 'CODE' | 'SEQUENCE' | 'RANDOM';
  pattern: string;
  confidence: number;
  sampleValues: string[];
  totalOccurrences: number;
  coverage: number;
};

export type QualityIssue = {
  tableName: string;
  columnName: string;
  issueType: 'DUPLICATE' | 'NULL_VALUE' | 'INVALID_FORMAT' | 'OUTLIER' | 'INCONSISTENT' | 'MISSING_REFERENCE' | 'TRUNCATED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affectedRows: number;
  totalRows: number;
  percentage: number;
  sampleProblems: string[];
  description: string;
};

export type BusinessRule = {
  rule: string;
  tableName: string;
  columnName: string;
  ruleType: 'RANGE' | 'FORMAT' | 'REFERENCE' | 'BUSINESS_LOGIC' | 'TEMPORAL';
  complianceScore: number;
  violations: number;
  totalRows: number;
  description: string;
};

export async function discoverDataQuality(pool: sql.ConnectionPool): Promise<DataDiscoveryResult> {
  
  // Análise de padrões de dados
  const dataPatterns = await analyzeDataPatterns(pool);
  
  // Análise de qualidade
  const qualityIssues = await analyzeDataQuality(pool);
  
  // Análise de regras de negócio
  const businessRules = await analyzeBusinessRules(pool);
  
  // Cálculo de scores
  const scores = calculateQualityScores(dataPatterns, qualityIssues, businessRules);
  
  // Recomendações
  const recommendations = generateDataQualityRecommendations(qualityIssues, businessRules);

  return {
    ...scores,
    dataPatterns,
    qualityIssues,
    businessRules,
    recommendations
  };
}

async function analyzeDataPatterns(pool: sql.ConnectionPool): Promise<DataPattern[]> {
  const patterns: DataPattern[] = [];
  
  // Obter amostra de dados de cada tabela
  const tablesResult = await pool.request().query(`
    SELECT 
      t.name AS table_name,
      c.name AS column_name,
      ty.name AS data_type,
      c.max_length,
      c.is_nullable
    FROM sys.tables t
    JOIN sys.columns c ON t.object_id = c.object_id
    JOIN sys.types ty ON c.user_type_id = ty.user_type_id
    WHERE t.is_ms_shipped = 0
    ORDER BY t.name, c.column_id
  `);

  // Analisar padrões para cada coluna
  for (const row of tablesResult.recordset) {
    const pattern = await analyzeColumnPattern(pool, row.table_name, row.column_name, row.data_type);
    if (pattern) {
      patterns.push(pattern);
    }
  }

  return patterns;
}

async function analyzeColumnPattern(
  pool: sql.ConnectionPool, 
  tableName: string, 
  columnName: string, 
  dataType: string
): Promise<DataPattern | null> {
  
  try {
    // Obter amostra de valores (máximo 1000 para performance)
    const sampleResult = await pool.request().query(`
      SELECT TOP 1000 ${columnName} as value
      FROM ${tableName}
      WHERE ${columnName} IS NOT NULL
      ORDER BY NEWID()
    `);

    if (sampleResult.recordset.length === 0) return null;

    const values = sampleResult.recordset.map(row => row.value?.toString() || '');
    const totalOccurrences = sampleResult.recordset.length;

    // Detectar padrões
    const patterns = detectPatterns(values);
    
    if (patterns.length === 0) return null;

    // Retornar o padrão com maior confiança
    const bestPattern = patterns.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    return {
      tableName,
      columnName,
      patternType: bestPattern.type,
      pattern: bestPattern.pattern,
      confidence: bestPattern.confidence,
      sampleValues: values.slice(0, 5),
      totalOccurrences,
      coverage: (totalOccurrences / 1000) * 100
    };
  } catch (error) {
    console.error(`Erro ao analisar padrão da coluna ${tableName}.${columnName}:`, error);
    return null;
  }
}

function detectPatterns(values: string[]): Array<{type: DataPattern['patternType'], pattern: string, confidence: number}> {
  const patterns: Array<{type: DataPattern['patternType'], pattern: string, confidence: number}> = [];
  
  // Padrão de Email
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const emailMatches = values.filter(v => emailPattern.test(v)).length;
  if (emailMatches / values.length > 0.8) {
    patterns.push({ type: 'EMAIL', pattern: emailPattern.source, confidence: (emailMatches / values.length) * 100 });
  }

  // Padrão de Telefone Brasileiro
  const phonePattern = /^(\+55\s?)?(\(?\d{2}\)?\s?)?(\d{4,5}-?\d{4})$/;
  const phoneMatches = values.filter(v => phonePattern.test(v.replace(/\D/g, ''))).length;
  if (phoneMatches / values.length > 0.7) {
    patterns.push({ type: 'PHONE', pattern: phonePattern.source, confidence: (phoneMatches / values.length) * 100 });
  }

  // Padrão de CPF
  const cpfPattern = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
  const cpfMatches = values.filter(v => {
    const cleanCpf = v.replace(/\D/g, '');
    return cleanCpf.length === 11 && cpfPattern.test(v);
  }).length;
  if (cpfMatches / values.length > 0.8) {
    patterns.push({ type: 'CPF', pattern: cpfPattern.source, confidence: (cpfMatches / values.length) * 100 });
  }

  // Padrão de CNPJ
  const cnpjPattern = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/;
  const cnpjMatches = values.filter(v => {
    const cleanCnpj = v.replace(/\D/g, '');
    return cleanCnpj.length === 14 && cnpjPattern.test(v);
  }).length;
  if (cnpjMatches / values.length > 0.8) {
    patterns.push({ type: 'CNPJ', pattern: cnpjPattern.source, confidence: (cnpjMatches / values.length) * 100 });
  }

  // Padrão de Data
  const datePattern = /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$|^\d{2}-\d{2}-\d{4}$/;
  const dateMatches = values.filter(v => {
    return !isNaN(Date.parse(v)) || datePattern.test(v);
  }).length;
  if (dateMatches / values.length > 0.8) {
    patterns.push({ type: 'DATE', pattern: datePattern.source, confidence: (dateMatches / values.length) * 100 });
  }

  // Padrão de Moeda
  const currencyPattern = /^R\$\s?\d{1,3}(\.\d{3})*,\d{2}$|^\d{1,3}(\.\d{3})*,\d{2}$/;
  const currencyMatches = values.filter(v => currencyPattern.test(v)).length;
  if (currencyMatches / values.length > 0.7) {
    patterns.push({ type: 'CURRENCY', pattern: currencyPattern.source, confidence: (currencyMatches / values.length) * 100 });
  }

  // Padrão de Porcentagem
  const percentagePattern = /^\d{1,3}(\.\d{1,2})?%$/;
  const percentageMatches = values.filter(v => percentagePattern.test(v)).length;
  if (percentageMatches / values.length > 0.8) {
    patterns.push({ type: 'PERCENTAGE', pattern: percentagePattern.source, confidence: (percentageMatches / values.length) * 100 });
  }

  // Padrão de Código/Sequência
  const codePattern = /^[A-Z]{2,3}\d{3,6}$|^\d{3,6}$/;
  const codeMatches = values.filter(v => codePattern.test(v)).length;
  if (codeMatches / values.length > 0.7) {
    patterns.push({ type: 'CODE', pattern: codePattern.source, confidence: (codeMatches / values.length) * 100 });
  }

  return patterns;
}

async function analyzeDataQuality(pool: sql.ConnectionPool): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];
  
  // Análise de duplicatas
  const duplicateIssues = await analyzeDuplicates(pool);
  issues.push(...duplicateIssues);
  
  // Análise de valores nulos
  const nullIssues = await analyzeNullValues(pool);
  issues.push(...nullIssues);
  
  // Análise de formatos inválidos
  const formatIssues = await analyzeInvalidFormats(pool);
  issues.push(...formatIssues);
  
  // Análise de outliers
  const outlierIssues = await analyzeOutliers(pool);
  issues.push(...outlierIssues);

  return issues;
}

async function analyzeDuplicates(pool: sql.ConnectionPool): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];
  
  const tablesResult = await pool.request().query(`
    SELECT name FROM sys.tables WHERE is_ms_shipped = 0
  `);

  for (const table of tablesResult.recordset) {
    const tableName = table.name;
    
    // Obter colunas que podem ter duplicatas
    const columnsResult = await pool.request().query(`
      SELECT name FROM sys.columns 
      WHERE object_id = OBJECT_ID('${tableName}')
      AND name NOT LIKE '%id%'
      AND system_type_id IN (167, 175, 231, 239) -- Tipos de string
    `);

    for (const column of columnsResult.recordset) {
      const columnName = column.name;
      
      try {
        const duplicateResult = await pool.request().query(`
          SELECT ${columnName}, COUNT(*) as count
          FROM ${tableName}
          WHERE ${columnName} IS NOT NULL AND LEN(${columnName}) > 0
          GROUP BY ${columnName}
          HAVING COUNT(*) > 1
          ORDER BY COUNT(*) DESC
        `);

        if (duplicateResult.recordset.length > 0) {
          const totalRowsResult = await pool.request().query(`
            SELECT COUNT(*) as total FROM ${tableName} WHERE ${columnName} IS NOT NULL
          `);
          
          const totalRows = totalRowsResult.recordset[0].total;
          const affectedRows = duplicateResult.recordset.reduce((sum, row) => sum + row.count, 0);
          
          issues.push({
            tableName,
            columnName,
            issueType: 'DUPLICATE',
            severity: affectedRows > totalRows * 0.1 ? 'HIGH' : 'MEDIUM',
            affectedRows,
            totalRows,
            percentage: (affectedRows / totalRows) * 100,
            sampleProblems: duplicateResult.recordset.slice(0, 3).map(row => row[columnName]),
            description: `Encontradas ${duplicateResult.recordset.length} duplicatas na coluna ${columnName}`
          });
        }
      } catch (error) {
        console.error(`Erro ao analisar duplicatas em ${tableName}.${columnName}:`, error);
      }
    }
  }

  return issues;
}

async function analyzeNullValues(pool: sql.ConnectionPool): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];
  
  const result = await pool.request().query(`
    SELECT 
      t.name AS table_name,
      c.name AS column_name,
      c.is_nullable,
      (SELECT COUNT(*) FROM ${tableName} WHERE ${columnName} IS NULL) as null_count,
      (SELECT COUNT(*) FROM ${tableName}) as total_rows
    FROM sys.tables t
    JOIN sys.columns c ON t.object_id = c.object_id
    WHERE t.is_ms_shipped = 0
  `);

  for (const row of result.recordset) {
    if (row.null_count > 0 && row.null_count / row.total_rows > 0.1) {
      issues.push({
        tableName: row.table_name,
        columnName: row.column_name,
        issueType: 'NULL_VALUE',
        severity: row.null_count / row.total_rows > 0.3 ? 'HIGH' : 'MEDIUM',
        affectedRows: row.null_count,
        totalRows: row.total_rows,
        percentage: (row.null_count / row.total_rows) * 100,
        sampleProblems: [],
        description: `Alta taxa de valores nulos (${(row.null_count / row.total_rows * 100).toFixed(1)}%) na coluna ${row.column_name}`
      });
    }
  }

  return issues;
}

async function analyzeInvalidFormats(pool: sql.ConnectionPool): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];
  
  // Análise de CPFs inválidos
  const invalidCpfs = await analyzeInvalidCpfs(pool);
  issues.push(...invalidCpfs);
  
  // Análise de CNPJs inválidos
  const invalidCnpjs = await analyzeInvalidCnpjs(pool);
  issues.push(...invalidCnpjs);
  
  // Análise de emails inválidos
  const invalidEmails = await analyzeInvalidEmails(pool);
  issues.push(...invalidEmails);

  return issues;
}

async function analyzeInvalidCpfs(pool: sql.ConnectionPool): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];
  
  const result = await pool.request().query(`
    SELECT 
      t.name AS table_name,
      c.name AS column_name
    FROM sys.tables t
    JOIN sys.columns c ON t.object_id = c.object_id
    WHERE c.name LIKE '%cpf%'
  `);

  for (const row of result.recordset) {
    try {
      const invalidResult = await pool.request().query(`
        SELECT ${row.columnName} as cpf_value
        FROM ${row.tableName}
        WHERE ${row.columnName} IS NOT NULL 
          AND LEN(${row.columnName}) > 0
          AND dbo.isValidCPF(${row.columnName}) = 0
      `);

      if (invalidResult.recordset.length > 0) {
        const totalResult = await pool.request().query(`
          SELECT COUNT(*) as total FROM ${row.tableName} WHERE ${row.columnName} IS NOT NULL
        `);
        
        issues.push({
          tableName: row.table_name,
          columnName: row.column_name,
          issueType: 'INVALID_FORMAT',
          severity: 'HIGH',
          affectedRows: invalidResult.recordset.length,
          totalRows: totalResult.recordset[0].total,
          percentage: (invalidResult.recordset.length / totalResult.recordset[0].total) * 100,
          sampleProblems: invalidResult.recordset.slice(0, 3).map(row => row.cpf_value),
          description: `CPFs com formato inválido detectados`
        });
      }
    } catch (error) {
      // Função isValidCPF pode não existir, ignorar
      console.warn(`Função isValidCPF não encontrada para ${row.tableName}.${row.columnName}`);
    }
  }

  return issues;
}

async function analyzeInvalidCnpjs(pool: sql.ConnectionPool): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];
  
  const result = await pool.request().query(`
    SELECT 
      t.name AS table_name,
      c.name AS column_name
    FROM sys.tables t
    JOIN sys.columns c ON t.object_id = c.object_id
    WHERE c.name LIKE '%cnpj%'
  `);

  for (const row of result.recordset) {
    try {
      const invalidResult = await pool.request().query(`
        SELECT ${row.columnName} as cnpj_value
        FROM ${row.tableName}
        WHERE ${row.columnName} IS NOT NULL 
          AND LEN(${row.columnName}) > 0
          AND dbo.isValidCNPJ(${row.columnName}) = 0
      `);

      if (invalidResult.recordset.length > 0) {
        const totalResult = await pool.request().query(`
          SELECT COUNT(*) as total FROM ${row.tableName} WHERE ${row.columnName} IS NOT NULL
        `);
        
        issues.push({
          tableName: row.table_name,
          columnName: row.column_name,
          issueType: 'INVALID_FORMAT',
          severity: 'HIGH',
          affectedRows: invalidResult.recordset.length,
          totalRows: totalResult.recordset[0].total,
          percentage: (invalidResult.recordset.length / totalResult.recordset[0].total) * 100,
          sampleProblems: invalidResult.recordset.slice(0, 3).map(row => row.cnpj_value),
          description: `CNPJs com formato inválido detectados`
        });
      }
    } catch (error) {
      console.warn(`Função isValidCNPJ não encontrada para ${row.tableName}.${row.columnName}`);
    }
  }

  return issues;
}

async function analyzeInvalidEmails(pool: sql.ConnectionPool): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];
  
  const result = await pool.request().query(`
    SELECT 
      t.name AS table_name,
      c.name AS column_name
    FROM sys.tables t
    JOIN sys.columns c ON t.object_id = c.object_id
    WHERE c.name LIKE '%email%'
  `);

  for (const row of result.recordset) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    try {
      const invalidResult = await pool.request().query(`
        SELECT ${row.columnName} as email_value
        FROM ${row.tableName}
        WHERE ${row.columnName} IS NOT NULL 
          AND LEN(${row.columnName}) > 0
          AND ${row.columnName} NOT LIKE '%@%.%'
      `);

      if (invalidResult.recordset.length > 0) {
        const totalResult = await pool.request().query(`
          SELECT COUNT(*) as total FROM ${row.tableName} WHERE ${row.columnName} IS NOT NULL
        `);
        
        issues.push({
          tableName: row.table_name,
          columnName: row.column_name,
          issueType: 'INVALID_FORMAT',
          severity: 'MEDIUM',
          affectedRows: invalidResult.recordset.length,
          totalRows: totalResult.recordset[0].total,
          percentage: (invalidResult.recordset.length / totalResult.recordset[0].total) * 100,
          sampleProblems: invalidResult.recordset.slice(0, 3).map(row => row.email_value),
          description: `Emails com formato inválido detectados`
        });
      }
    } catch (error) {
      console.error(`Erro ao analisar emails em ${row.tableName}.${row.columnName}:`, error);
    }
  }

  return issues;
}

async function analyzeOutliers(pool: sql.ConnectionPool): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];
  
  // Análise de outliers em colunas numéricas
  const numericColumnsResult = await pool.request().query(`
    SELECT 
      t.name AS table_name,
      c.name AS column_name
    FROM sys.tables t
    JOIN sys.columns c ON t.object_id = c.object_id
    WHERE t.is_ms_shipped = 0
      AND c.system_type_id IN (48, 52, 56, 59, 60, 62, 104, 106, 108, 122, 127) -- Tipos numéricos
  `);

  for (const row of numericColumnsResult.recordset) {
    try {
      // Calcular estatísticas
      const statsResult = await pool.request().query(`
        SELECT 
          AVG(CAST(${row.columnName} AS FLOAT)) as mean,
          STDEV(CAST(${row.columnName} AS FLOAT)) as stddev,
          COUNT(*) as total_count
        FROM ${row.tableName}
        WHERE ${row.columnName} IS NOT NULL
      `);

      const { mean, stddev, total_count } = statsResult.recordset[0];
      
      if (mean !== null && stddev !== null && total_count > 10) {
        // Detectar outliers usando método IQR
        const outlierResult = await pool.request().query(`
          SELECT ${row.columnName} as value
          FROM ${row.tableName}
          WHERE ${row.columnName} IS NOT NULL
            AND (CAST(${row.columnName} AS FLOAT) > ${mean + (3 * stddev)}
              OR CAST(${row.columnName} AS FLOAT) < ${mean - (3 * stddev)})
        `);

        if (outlierResult.recordset.length > 0) {
          issues.push({
            tableName: row.table_name,
            columnName: row.column_name,
            issueType: 'OUTLIER',
            severity: outlierResult.recordset.length > total_count * 0.05 ? 'HIGH' : 'MEDIUM',
            affectedRows: outlierResult.recordset.length,
            totalRows: total_count,
            percentage: (outlierResult.recordset.length / total_count) * 100,
            sampleProblems: outlierResult.recordset.slice(0, 3).map(row => row.value?.toString() || ''),
            description: `Valores outliers detectados (fora de 3 desvios padrão)`
          });
        }
      }
    } catch (error) {
      console.error(`Erro ao analisar outliers em ${row.tableName}.${row.columnName}:`, error);
    }
  }

  return issues;
}

async function analyzeBusinessRules(pool: sql.ConnectionPool): Promise<BusinessRule[]> {
  const rules: BusinessRule[] = [];
  
  // Análise de consistência de datas
  const dateConsistencyRules = await analyzeDateConsistency(pool);
  rules.push(...dateConsistencyRules);
  
  // Análise de referências cruzadas
  const referenceRules = await analyzeReferenceConsistencyFixed(pool);
  rules.push(...referenceRules);

  return rules;
}

async function analyzeDateConsistency(pool: sql.ConnectionPool): Promise<BusinessRule[]> {
  const rules: BusinessRule[] = [];
  
  // Encontrar tabelas com múltiplas colunas de data
  const tablesWithDatesResult = await pool.request().query(`
    SELECT 
      t.name AS table_name,
      c.name AS column_name
    FROM sys.tables t
    JOIN sys.columns c ON t.object_id = c.object_id
    WHERE t.is_ms_shipped = 0
      AND (
        c.name LIKE '%data%' OR 
        c.name LIKE '%date%' OR 
        c.name LIKE '%cria%' OR 
        c.name LIKE '%atualiza%'
      )
      AND c.system_type_id IN (40, 42, 43, 58, 61) -- Tipos de data
    GROUP BY t.name, c.name
    HAVING COUNT(*) > 1
  `);

  // Para cada tabela, verificar consistência entre datas
  for (const row of tablesWithDatesResult.recordset) {
    try {
      // Verificar se data de criação <= data de atualização
      const consistencyResult = await pool.request().query(`
        SELECT COUNT(*) as violations
        FROM ${row.table_name}
        WHERE data_criacao > data_atualizacao
      `);

      if (consistencyResult.recordset[0].violations > 0) {
        const totalResult = await pool.request().query(`
          SELECT COUNT(*) as total FROM ${row.table_name}
        `);
        
        rules.push({
          rule: 'data_criacao <= data_atualizacao',
          tableName: row.table_name,
          columnName: 'data_criacao, data_atualizacao',
          ruleType: 'TEMPORAL',
          complianceScore: Math.max(0, 100 - (consistencyResult.recordset[0].violations / totalResult.recordset[0].total * 100)),
          violations: consistencyResult.recordset[0].violations,
          totalRows: totalResult.recordset[0].total,
          description: 'Data de criação deve ser menor ou igual à data de atualização'
        });
      }
    } catch (error) {
      console.error(`Erro ao analisar consistência de datas em ${row.table_name}:`, error);
    }
  }

  return rules;
}

async function analyzeReferenceConsistencyFixed(pool: sql.ConnectionPool): Promise<BusinessRule[]> {
  const rules: BusinessRule[] = [];

  const fkResult = await pool.request().query(`
    SELECT 
      fk.name AS fk_name,
      tp.name AS parent_table,
      cp.name AS parent_column,
      tr.name AS referenced_table,
      cr.name AS referenced_column
    FROM sys.foreign_keys fk
    JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
    JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
    JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
  `);

  for (const row of fkResult.recordset) {
    try {
      const parentTable = `[${row.parent_table}]`;
      const refTable = `[${row.referenced_table}]`;
      const parentCol = `[${row.parent_column}]`;
      const refCol = `[${row.referenced_column}]`;

      const orphanResult = await pool.request().query(`
        SELECT COUNT(*) as orphans
        FROM ${parentTable} p
        LEFT JOIN ${refTable} r ON p.${parentCol} = r.${refCol}
        WHERE p.${parentCol} IS NOT NULL AND r.${refCol} IS NULL
      `);

      const totalResult = await pool.request().query(`
        SELECT COUNT(*) as total FROM ${parentTable}
      `);

      const orphans = orphanResult.recordset[0]?.orphans ?? 0;
      const total = totalResult.recordset[0]?.total ?? 0;
      const compliance = total > 0 ? Math.max(0, 100 - (orphans / total) * 100) : 100;

      rules.push({
        rule: `FK ${row.fk_name} sem registros órfãos`,
        tableName: row.parent_table,
        columnName: row.parent_column,
        ruleType: 'REFERENCE',
        complianceScore: compliance,
        violations: orphans,
        totalRows: total,
        description: `Verifica consistência referencial entre ${row.parent_table}.${row.parent_column} e ${row.referenced_table}.${row.referenced_column}`
      });
    } catch (error) {
      console.error(`Erro ao analisar referências em ${row.parent_table}.${row.parent_column} -> ${row.referenced_table}.${row.referenced_column}:`, error);
    }
  }

  return rules;
}