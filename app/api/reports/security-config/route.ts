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

    // Configurações do servidor
    const [serverConfig, loginConfig, encryptionConfig] = await Promise.all([
      pool.request().query(`
        SELECT 
          @@VERSION AS version,
          SERVERPROPERTY('ProductVersion') AS product_version,
          SERVERPROPERTY('ProductLevel') AS product_level,
          SERVERPROPERTY('Edition') AS edition,
          SERVERPROPERTY('IsClustered') AS is_clustered
      `),
      pool.request().query(`
        SELECT 
          CASE WHEN EXISTS (
            SELECT 1 FROM sys.sql_logins WHERE is_policy_checked = 0
          ) THEN 1 ELSE 0 END AS weak_passwords,
          COUNT(*) AS total_logins
        FROM sys.sql_logins
      `),
      pool.request().query(`
        SELECT 
          CASE WHEN EXISTS (
            SELECT 1 FROM sys.databases WHERE name = @database AND is_encrypted = 1
          ) THEN 1 ELSE 0 END AS tde_enabled
      `).input('database', sql.NVarChar, database)
    ]);

    const report = {
      serverConfiguration: {
        version: serverConfig.recordset[0]?.version || "Unknown",
        productVersion: serverConfig.recordset[0]?.product_version || "Unknown",
        productLevel: serverConfig.recordset[0]?.product_level || "Unknown",
        edition: serverConfig.recordset[0]?.edition || "Unknown",
        isClustered: serverConfig.recordset[0]?.is_clustered === 1
      },
      loginConfiguration: {
        totalLogins: loginConfig.recordset[0]?.total_logins || 0,
        weakPasswords: loginConfig.recordset[0]?.weak_passwords === 1
      },
      encryptionConfiguration: {
        tdeEnabled: encryptionConfig.recordset[0]?.tde_enabled === 1,
        encryptionScore: securityAnalysis.securityMetrics.encryptionScore
      },
      auditConfiguration: securityAnalysis.auditConfig,
      securityMetrics: securityAnalysis.securityMetrics,
      recommendations: [
        securityAnalysis.securityMetrics.encryptionScore < 50
          ? "Habilitar TDE (Transparent Data Encryption) para criptografia em repouso"
          : "TDE está habilitado",
        loginConfig.recordset[0]?.weak_passwords === 1
          ? "Implementar políticas de senha fortes"
          : "Políticas de senha estão configuradas",
        "Habilitar auditoria para operações críticas",
        "Revisar configurações de login e permissões regularmente",
        "Implementar backup criptografado"
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

