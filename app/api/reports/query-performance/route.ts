import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { inspectPerformance } from "@/lib/performanceInspector";

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
    const performanceAnalysis = await inspectPerformance(pool);

    // Top 10 queries mais lentas
    const slowestQueries = performanceAnalysis.queryPerformance
      .sort((a, b) => b.avgExecutionTime - a.avgExecutionTime)
      .slice(0, 10);

    // Queries com maior I/O
    const highestIOQueries = performanceAnalysis.queryPerformance
      .sort((a, b) => b.avgLogicalReads - a.avgLogicalReads)
      .slice(0, 10);

    // Queries críticas
    const criticalQueries = performanceAnalysis.queryPerformance.filter(
      (q) => q.performanceClass === "CRITICAL"
    );

    const report = {
      summary: {
        totalQueries: performanceAnalysis.queryPerformance.length,
        slowQueries: performanceAnalysis.queryPerformance.filter(
          (q) => q.performanceClass === "SLOW" || q.performanceClass === "CRITICAL"
        ).length,
        criticalQueries: criticalQueries.length,
        averageExecutionTime: performanceAnalysis.performanceMetrics.avgQueryTime,
        maxExecutionTime: performanceAnalysis.performanceMetrics.maxQueryTime,
        queryPerformanceScore: performanceAnalysis.performanceMetrics.queryPerformanceScore
      },
      slowestQueries: slowestQueries.map((q) => ({
        queryText: q.queryText.substring(0, 500),
        executionCount: q.executionCount,
        avgExecutionTime: q.avgExecutionTime,
        totalExecutionTime: q.totalExecutionTime,
        avgCpuTime: q.avgCpuTime,
        avgLogicalReads: q.avgLogicalReads,
        performanceClass: q.performanceClass,
        lastExecutionTime: q.lastExecutionTime
      })),
      highestIOQueries: highestIOQueries.map((q) => ({
        queryText: q.queryText.substring(0, 500),
        avgLogicalReads: q.avgLogicalReads,
        avgExecutionTime: q.avgExecutionTime,
        executionCount: q.executionCount
      })),
      criticalQueries: criticalQueries.map((q) => ({
        queryText: q.queryText.substring(0, 500),
        avgExecutionTime: q.avgExecutionTime,
        performanceClass: q.performanceClass,
        recommendations: [
          "Analisar plano de execução",
          "Verificar índices faltando",
          "Considerar reescrever query",
          "Verificar estatísticas atualizadas"
        ]
      })),
      allQueries: performanceAnalysis.queryPerformance,
      performanceMetrics: performanceAnalysis.performanceMetrics,
      recommendations: [
        "Identificar e otimizar queries mais lentas",
        "Criar índices baseados em padrões de acesso",
        "Atualizar estatísticas regularmente",
        "Considerar particionamento para tabelas grandes",
        "Revisar planos de execução"
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

