import { NextRequest, NextResponse } from "next/server";
import { inspectSqlServer } from "@/lib/sqlInspector";
import { computeVulnerabilityMetrics, computeStructuralKpis } from "@/lib/metrics";
import { describeSchemaWithAI } from "@/lib/ai";
import { inspectSecurity } from "@/lib/securityInspector";
import { inspectPerformance } from "@/lib/performanceInspector";
import sql from "mssql";

async function createSecurePool(
  server: string,
  port: number,
  user: string,
  password: string,
  database: string
): Promise<{ pool: sql.ConnectionPool; mode: "tls" | "insecure" }> {
  const secure: sql.config = {
    server,
    port,
    user,
    password,
    database,
    options: {
      encrypt: true,
      trustServerCertificate: false,
      enableArithAbort: true
    },
    connectionTimeout: 15000,
    requestTimeout: 15000,
    pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
  };

  try {
    const pool = await sql.connect(secure);
    return { pool, mode: "tls" };
  } catch {
    const fallback: sql.config = {
      server,
      port,
      user,
      password,
      database,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
      },
      connectionTimeout: 15000,
      requestTimeout: 15000,
      pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
    };
    const pool = await sql.connect(fallback);
    return { pool, mode: "insecure" };
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      server = "104.234.224.238",
      port = 1445,
      user,
      password,
      database
    } = body || {};

    if (!user || !password || !database) {
      return NextResponse.json(
        { error: "user, password e database são obrigatórios" },
        { status: 400 }
      );
    }

    const analysis = await inspectSqlServer({
      server,
      port: Number(port),
      user,
      password,
      database
    });

    const vulns = computeVulnerabilityMetrics(analysis);
    const kpis = computeStructuralKpis(analysis);

    // Nova análise de segurança
    const { pool, mode } = await createSecurePool(server, Number(port), user, password, database);
    let securityAnalysis: any = {
      securityMetrics: {
        sensitiveDataScore: 0,
        userAccessScore: 0,
        securityConfigurationScore: 0,
        encryptionScore: 0,
        overallSecurityScore: 0,
        totalSensitiveColumns: 0,
        highRiskUsers: 0,
        dangerousFeaturesEnabled: 0
      },
      sensitiveData: [],
      userPermissions: [],
      auditConfig: null
    };
    try {
      securityAnalysis = await inspectSecurity(pool, database);
    } catch (e) {
      console.warn("Falha na análise de segurança:", e);
    }

    // Nova análise de performance
    let performanceAnalysis: any = {
      performanceMetrics: {
        indexEfficiency: 0,
        queryPerformanceScore: 0,
        fragmentationScore: 0,
        memoryUsageScore: 0,
        overallPerformanceScore: 0,
        missingIndexes: 0,
        unusedIndexes: 0,
        fragmentedIndexes: 0,
        slowQueries: 0,
        avgQueryTime: 0,
        maxQueryTime: 0,
        totalQueries: 0
      },
      indexAnalysis: [],
      queryPerformance: [],
      recommendations: []
    };
    try {
      performanceAnalysis = await inspectPerformance(pool);
    } catch (e) {
      console.warn("Falha na análise de performance:", e);
    }

    const aiSummary = await describeSchemaWithAI({
      analysis,
      vulns,
      kpis,
      securityMetrics: securityAnalysis.securityMetrics,
      performanceMetrics: performanceAnalysis.performanceMetrics
    });

    return NextResponse.json({
      analysis,
      vulns,
      kpis,
      securityMetrics: securityAnalysis.securityMetrics,
      sensitiveData: securityAnalysis.sensitiveData,
      userPermissions: securityAnalysis.userPermissions,
      auditConfig: securityAnalysis.auditConfig,
      performanceMetrics: performanceAnalysis.performanceMetrics,
      indexAnalysis: performanceAnalysis.indexAnalysis,
      queryPerformance: performanceAnalysis.queryPerformance,
      recommendations: performanceAnalysis.recommendations,
      aiSummary,
      connectionSecurity: mode
    });
  } catch (err: any) {
    console.error("Erro em /api/analyze:", err);
    return NextResponse.json(
      {
        error: "Falha ao analisar banco",
        details: err?.message ?? String(err)
      },
      { status: 500 }
    );
  }
}
