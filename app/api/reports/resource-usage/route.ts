import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";

async function createPool(server: string, port: number, user: string, password: string, database: string) {
  const config: sql.config = {
    server,
    port,
    user,
    password,
    database,
    options: { encrypt: false, trustServerCertificate: true },
    connectionTimeout: 15000,
    requestTimeout: 15000,
    pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
  };
  return await sql.connect(config);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let pool: sql.ConnectionPool | null = null;
  try {
    const { searchParams } = new URL(req.url);
    const server = searchParams.get("server") || "104.234.224.238";
    const port = Number(searchParams.get("port")) || 1445;
    const user = searchParams.get("user") || "angrax";
    const password = searchParams.get("password") || "";
    const database = searchParams.get("database") || "sgc";

    if (!password) {
      return NextResponse.json({ error: "password é obrigatório" }, { status: 400 });
    }

    pool = await createPool(server, port, user, password, database);

    // Uso de memória
    const [memoryUsage, cpuUsage, ioStats, tableSizes] = await Promise.all([
      pool.request().query(`
        SELECT 
          (physical_memory_in_use_kb / 1024.0) AS memory_usage_mb,
          (total_physical_memory_kb / 1024.0) AS total_memory_mb,
          (available_physical_memory_kb / 1024.0) AS available_memory_mb
        FROM sys.dm_os_sys_memory
      `),
      pool.request().query(`
        SELECT 
          AVG(cpu_percent) AS avg_cpu_percent,
          MAX(cpu_percent) AS max_cpu_percent
        FROM sys.dm_os_ring_buffers
        WHERE ring_buffer_type = 'RING_BUFFER_SCHEDULER_MONITOR'
      `).catch(() => ({ recordset: [{ avg_cpu_percent: 0, max_cpu_percent: 0 }] })),
      pool.request().query(`
        SELECT 
          SUM(num_of_reads) AS total_reads,
          SUM(num_of_writes) AS total_writes,
          SUM(num_of_bytes_read) AS total_bytes_read,
          SUM(num_of_bytes_written) AS total_bytes_written
        FROM sys.dm_io_virtual_file_stats(NULL, NULL)
      `),
      pool.request().query(`
        SELECT 
          s.name AS schema_name,
          t.name AS table_name,
          SUM(p.rows) AS row_count,
          SUM(a.total_pages) * 8 / 1024.0 AS size_mb,
          SUM(a.used_pages) * 8 / 1024.0 AS used_mb
        FROM sys.tables t
        JOIN sys.schemas s ON t.schema_id = s.schema_id
        JOIN sys.indexes i ON t.object_id = i.object_id
        JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
        JOIN sys.allocation_units a ON p.partition_id = a.container_id
        WHERE t.is_ms_shipped = 0
        GROUP BY s.name, t.name
        ORDER BY size_mb DESC
      `)
    ]);

    const memoryData = memoryUsage.recordset[0] || {};
    const cpuData = cpuUsage.recordset[0] || {};
    const ioData = ioStats.recordset[0] || {};

    const report = {
      memoryUsage: {
        usedMB: memoryData.memory_usage_mb || 0,
        totalMB: memoryData.total_memory_mb || 0,
        availableMB: memoryData.available_memory_mb || 0,
        usagePercent: memoryData.total_memory_mb
          ? ((memoryData.memory_usage_mb / memoryData.total_memory_mb) * 100).toFixed(2)
          : 0
      },
      cpuUsage: {
        avgPercent: cpuData.avg_cpu_percent || 0,
        maxPercent: cpuData.max_cpu_percent || 0
      },
      ioStatistics: {
        totalReads: ioData.total_reads || 0,
        totalWrites: ioData.total_writes || 0,
        totalBytesRead: ioData.total_bytes_read || 0,
        totalBytesWritten: ioData.total_bytes_written || 0
      },
      tableSizes: tableSizes.recordset.slice(0, 20).map((r: any) => ({
        schema: r.schema_name,
        table: r.table_name,
        rowCount: r.row_count,
        sizeMB: r.size_mb,
        usedMB: r.used_mb
      })),
      recommendations: [
        memoryData.memory_usage_mb > 8192
          ? "Considerar aumentar memória ou otimizar queries"
          : "Uso de memória está dentro do esperado",
        cpuData.max_cpu_percent > 80
          ? "CPU está alta - revisar queries e índices"
          : "CPU está dentro do esperado",
        "Monitorar I/O regularmente",
        "Considerar particionamento para tabelas grandes",
        "Revisar tamanho de índices"
      ],
      database,
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Erro ao gerar relatório:", error);
    return NextResponse.json(
      { error: "Falha ao gerar relatório", details: error?.message ?? String(error) },
      { status: 500 }
    );
  } finally {
    if (pool) {
      try {
        pool.close();
      } catch (e) {
        console.warn("Erro ao fechar pool:", e);
      }
    }
  }
}

