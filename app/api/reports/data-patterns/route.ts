import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
// import { inspectDataDiscovery } from "@/lib/dataDiscovery"; // Importado dinamicamente

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
    
    // Importar função de data discovery
    const { discoverDataQuality } = await import("@/lib/dataDiscovery");
    const dataDiscovery = await discoverDataQuality(pool);

    // Agrupar padrões por tipo
    const patternsByType = new Map<string, any[]>();
    dataDiscovery.dataPatterns.forEach((pattern) => {
      if (!patternsByType.has(pattern.patternType)) {
        patternsByType.set(pattern.patternType, []);
      }
      patternsByType.get(pattern.patternType)!.push(pattern);
    });

    // Identificar outliers
    const outliers = dataDiscovery.qualityIssues.filter((q) => q.issueType === "OUTLIER");

    // Valores mais frequentes
    const mostFrequent = dataDiscovery.dataPatterns
      .sort((a, b) => b.totalOccurrences - a.totalOccurrences)
      .slice(0, 20);

    const report = {
      summary: {
        totalPatterns: dataDiscovery.dataPatterns.length,
        patternTypes: Array.from(patternsByType.keys()),
        outliersCount: outliers.length,
        mostFrequentPatterns: mostFrequent.length
      },
      patternsByType: Array.from(patternsByType.entries()).map(([type, patterns]) => ({
        type,
        count: patterns.length,
        patterns: patterns.map((p) => ({
          tableName: p.tableName,
          columnName: p.columnName,
          patternType: p.patternType,
          confidence: p.confidence,
          totalOccurrences: p.totalOccurrences,
          coverage: p.coverage,
          sampleValues: p.sampleValues
        }))
      })),
      mostFrequentPatterns: mostFrequent.map((p) => ({
        tableName: p.tableName,
        columnName: p.columnName,
        patternType: p.patternType,
        totalOccurrences: p.totalOccurrences,
        coverage: p.coverage,
        sampleValues: p.sampleValues
      })),
      outliers: outliers.map((o) => ({
        tableName: o.tableName,
        columnName: o.columnName,
        description: o.description,
        severity: o.severity
      })),
      distributionAnalysis: {
        emailPatterns: dataDiscovery.dataPatterns.filter((p) => p.patternType === "EMAIL").length,
        phonePatterns: dataDiscovery.dataPatterns.filter((p) => p.patternType === "PHONE").length,
        datePatterns: dataDiscovery.dataPatterns.filter((p) => p.patternType === "DATE").length,
        currencyPatterns: dataDiscovery.dataPatterns.filter((p) => p.patternType === "CURRENCY").length
      },
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

