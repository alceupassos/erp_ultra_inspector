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

    // Categorizar índices
    const unusedIndexes = performanceAnalysis.indexAnalysis.filter((idx) => idx.efficiency === "UNUSED");
    const fragmentedIndexes = performanceAnalysis.indexAnalysis.filter(
      (idx) => idx.fragmentationPercent > 30
    );
    const highEfficiencyIndexes = performanceAnalysis.indexAnalysis.filter(
      (idx) => idx.efficiency === "HIGH"
    );

    // Gerar scripts SQL
    const dropUnusedScripts = unusedIndexes.map(
      (idx) => `-- Índice não utilizado: ${idx.indexName}\nDROP INDEX ${idx.indexName} ON [${idx.tableName}];\n`
    );

    const rebuildFragmentedScripts = fragmentedIndexes.map(
      (idx) =>
        `-- Índice fragmentado (${idx.fragmentationPercent.toFixed(2)}%): ${idx.indexName}\nALTER INDEX ${idx.indexName} ON [${idx.tableName}] REBUILD;\n`
    );

    // Sugestões de índices faltando (baseado em queries lentas)
    const missingIndexSuggestions = performanceAnalysis.queryPerformance
      .filter((q) => q.performanceClass === "SLOW" || q.performanceClass === "CRITICAL")
      .slice(0, 10)
      .map((q) => ({
        query: q.queryText.substring(0, 200),
        suggestion: "-- Analisar query e criar índice apropriado",
        avgExecutionTime: q.avgExecutionTime
      }));

    const report = {
      summary: {
        totalIndexes: performanceAnalysis.indexAnalysis.length,
        unusedIndexes: unusedIndexes.length,
        fragmentedIndexes: fragmentedIndexes.length,
        highEfficiencyIndexes: highEfficiencyIndexes.length,
        indexEfficiencyScore: performanceAnalysis.performanceMetrics.indexEfficiency
      },
      unusedIndexes: unusedIndexes.map((idx) => ({
        tableName: idx.tableName,
        indexName: idx.indexName,
        indexType: idx.indexType,
        sizeMB: idx.sizeMB,
        lastUserSeek: idx.lastUserSeek
      })),
      fragmentedIndexes: fragmentedIndexes.map((idx) => ({
        tableName: idx.tableName,
        indexName: idx.indexName,
        fragmentationPercent: idx.fragmentationPercent,
        pageCount: idx.pageCount,
        sizeMB: idx.sizeMB
      })),
      highEfficiencyIndexes: highEfficiencyIndexes.map((idx) => ({
        tableName: idx.tableName,
        indexName: idx.indexName,
        userSeeks: idx.userSeeks,
        userScans: idx.userScans,
        sizeMB: idx.sizeMB
      })),
      sqlScripts: {
        dropUnused: dropUnusedScripts.join("\n"),
        rebuildFragmented: rebuildFragmentedScripts.join("\n"),
        missingIndexSuggestions: missingIndexSuggestions
      },
      allIndexes: performanceAnalysis.indexAnalysis,
      performanceMetrics: performanceAnalysis.performanceMetrics,
      recommendations: [
        "Remover índices não utilizados para melhorar performance de writes",
        "Reconstruir índices fragmentados regularmente",
        "Monitorar criação de novos índices baseado em queries lentas",
        "Considerar índices filtrados para colunas com alta seletividade"
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

