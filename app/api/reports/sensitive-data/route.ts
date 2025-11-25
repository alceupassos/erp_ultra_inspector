import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { inspectSecurity } from "@/lib/securityInspector";

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
    const securityAnalysis = await inspectSecurity(pool, database);

    // Agrupar por tabela
    const byTable = new Map<string, any[]>();
    securityAnalysis.sensitiveData.forEach((item) => {
      const key = `${item.schema}.${item.tableName}`;
      if (!byTable.has(key)) {
        byTable.set(key, []);
      }
      byTable.get(key)!.push(item);
    });

    const tablesWithSensitiveData = Array.from(byTable.entries()).map(([table, items]) => {
      const criticalCount = items.filter((i) => i.riskLevel === "CRITICAL").length;
      const highCount = items.filter((i) => i.riskLevel === "HIGH").length;
      const mediumCount = items.filter((i) => i.riskLevel === "MEDIUM").length;
      const lowCount = items.filter((i) => i.riskLevel === "LOW").length;

      const riskScore =
        criticalCount * 10 + highCount * 7 + mediumCount * 4 + lowCount * 1;

      return {
        table,
        schema: items[0].schema,
        tableName: items[0].tableName,
        totalSensitiveColumns: items.length,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        riskScore,
        columns: items.map((i) => ({
          columnName: i.columnName,
          sensitiveType: i.sensitiveType,
          riskLevel: i.riskLevel,
          sampleValue: i.sampleValue
        }))
      };
    });

    tablesWithSensitiveData.sort((a, b) => b.riskScore - a.riskScore);

    const report = {
      summary: {
        totalSensitiveColumns: securityAnalysis.sensitiveData.length,
        totalTablesWithSensitiveData: tablesWithSensitiveData.length,
        criticalRiskColumns: securityAnalysis.sensitiveData.filter((s) => s.riskLevel === "CRITICAL").length,
        highRiskColumns: securityAnalysis.sensitiveData.filter((s) => s.riskLevel === "HIGH").length,
        overallRiskScore: securityAnalysis.securityMetrics.sensitiveDataScore
      },
      tablesWithSensitiveData,
      allSensitiveData: securityAnalysis.sensitiveData,
      securityMetrics: securityAnalysis.securityMetrics,
      recommendations: [
        "Implementar criptografia para colunas com dados críticos",
        "Aplicar mascaramento de dados em ambientes de desenvolvimento",
        "Revisar permissões de acesso a tabelas com dados sensíveis",
        "Implementar auditoria para acesso a dados sensíveis",
        "Considerar conformidade com LGPD para dados pessoais"
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

