import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { inspectSqlServer } from "@/lib/sqlInspector";
import { inspectSecurity } from "@/lib/securityInspector";
import { inspectPerformance } from "@/lib/performanceInspector";
import { computeVulnerabilityMetrics, computeStructuralKpis } from "@/lib/metrics";

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

    // Executar todas as análises
    const [analysis, securityAnalysis, performanceAnalysis] = await Promise.all([
      inspectSqlServer({ server, port, user, password, database }),
      inspectSecurity(pool, database),
      inspectPerformance(pool)
    ]);

    const vulns = computeVulnerabilityMetrics(analysis);
    const kpis = computeStructuralKpis(analysis);

    // KPIs principais
    const mainKPIs = {
      totalTables: analysis.tables.length,
      totalRows: analysis.tables.reduce((acc, t) => acc + t.rowCount, 0),
      securityScore: securityAnalysis.securityMetrics.overallSecurityScore,
      performanceScore: performanceAnalysis.performanceMetrics.overallPerformanceScore,
      dataQualityScore: 85, // Placeholder
      vulnerabilityScore: (1 - vulns.overallRiskScore) * 100
    };

    // Resumo de segurança
    const securitySummary = {
      sensitiveDataScore: securityAnalysis.securityMetrics.sensitiveDataScore,
      userAccessScore: securityAnalysis.securityMetrics.userAccessScore,
      encryptionScore: securityAnalysis.securityMetrics.encryptionScore,
      criticalIssues: securityAnalysis.sensitiveData.filter((s) => s.riskLevel === "CRITICAL").length,
      highRiskUsers: securityAnalysis.userPermissions.filter(
        (u) => u.isSysAdmin || u.hasDbOwner
      ).length
    };

    // Resumo de performance
    const performanceSummary = {
      indexEfficiency: performanceAnalysis.performanceMetrics.indexEfficiency,
      queryPerformance: performanceAnalysis.performanceMetrics.queryPerformanceScore,
      missingIndexes: performanceAnalysis.performanceMetrics.missingIndexes,
      unusedIndexes: performanceAnalysis.performanceMetrics.unusedIndexes,
      slowQueries: performanceAnalysis.performanceMetrics.slowQueries
    };

    // Recomendações prioritárias
    const priorityRecommendations = [
      securitySummary.criticalIssues > 0
        ? `URGENTE: ${securitySummary.criticalIssues} colunas com dados críticos precisam de proteção`
        : null,
      securitySummary.highRiskUsers > 0
        ? `Revisar permissões de ${securitySummary.highRiskUsers} usuários de alto risco`
        : null,
      performanceSummary.missingIndexes > 0
        ? `Criar ${performanceSummary.missingIndexes} índices faltando para melhorar performance`
        : null,
      performanceSummary.unusedIndexes > 0
        ? `Remover ${performanceSummary.unusedIndexes} índices não utilizados`
        : null,
      performanceSummary.slowQueries > 0
        ? `Otimizar ${performanceSummary.slowQueries} queries lentas`
        : null
    ].filter(Boolean) as string[];

    const report = {
      database: {
        name: database,
        server,
        port
      },
      mainKPIs,
      securitySummary,
      performanceSummary,
      structuralSummary: {
        totalTables: kpis.totalTables,
        avgColumnsPerTable: kpis.avgColumnsPerTable,
        avgRowCount: kpis.avgRowCount,
        tablesWithoutPK: vulns.tablesWithoutPrimaryKey,
        tablesWithoutFK: vulns.tablesWithoutForeignKeys
      },
      priorityRecommendations,
      overallHealth: {
        score: (mainKPIs.securityScore + mainKPIs.performanceScore + mainKPIs.dataQualityScore) / 3,
        status: (() => {
          const avg = (mainKPIs.securityScore + mainKPIs.performanceScore + mainKPIs.dataQualityScore) / 3;
          if (avg >= 80) return "EXCELLENT";
          if (avg >= 60) return "GOOD";
          if (avg >= 40) return "FAIR";
          return "POOR";
        })()
      },
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

