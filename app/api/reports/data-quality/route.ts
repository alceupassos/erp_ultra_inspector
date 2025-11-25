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

    // Calcular score de qualidade por tabela
    const qualityScores = dataDiscovery.dataPatterns.map((pattern) => {
      const issues = dataDiscovery.qualityIssues.filter(
        (issue) => issue.tableName === pattern.tableName
      );
      const score = Math.max(0, 100 - issues.length * 10);
      return {
        tableName: pattern.tableName,
        score,
        issuesCount: issues.length,
        patternsCount: 1
      };
    });

    qualityScores.sort((a, b) => a.score - b.score);

    const report = {
      summary: {
        totalPatterns: dataDiscovery.dataPatterns.length,
        totalQualityIssues: dataDiscovery.qualityIssues.length,
        totalBusinessRules: dataDiscovery.businessRules.length,
        averageQualityScore:
          qualityScores.length > 0
            ? qualityScores.reduce((acc, q) => acc + q.score, 0) / qualityScores.length
            : 100
      },
      dataPatterns: dataDiscovery.dataPatterns.map((p) => ({
        tableName: p.tableName,
        columnName: p.columnName,
        patternType: p.patternType,
        totalOccurrences: p.totalOccurrences,
        sampleValues: p.sampleValues
      })),
      qualityIssues: dataDiscovery.qualityIssues.map((q) => ({
        tableName: q.tableName,
        schema: q.schema,
        columnName: q.columnName,
        issueType: q.issueType,
        severity: q.severity,
        description: q.description,
        affectedRows: q.affectedRows
      })),
      businessRules: dataDiscovery.businessRules.map((r) => ({
        tableName: r.tableName,
        schema: r.schema,
        ruleType: r.ruleType,
        description: r.description,
        confidence: r.confidence
      })),
      qualityScores,
      recommendations: [
        "Corrigir problemas de qualidade identificados",
        "Implementar validações de dados na aplicação",
        "Criar regras de negócio documentadas",
        "Monitorar qualidade de dados regularmente",
        "Considerar ferramentas de data quality"
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

