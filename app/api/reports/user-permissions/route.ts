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

    // Identificar usuários de alto risco
    const highRiskUsers = securityAnalysis.userPermissions.filter(
      (u) => u.isSysAdmin || u.hasDbOwner || u.permissions.length > 10
    );

    // Agrupar permissões por tipo
    const permissionsByType = new Map<string, number>();
    securityAnalysis.userPermissions.forEach((u) => {
      u.permissions.forEach((p) => {
        permissionsByType.set(p, (permissionsByType.get(p) || 0) + 1);
      });
    });

    const report = {
      summary: {
        totalUsers: securityAnalysis.userPermissions.length,
        highRiskUsersCount: highRiskUsers.length,
        totalPermissions: securityAnalysis.userPermissions.reduce(
          (acc, u) => acc + u.permissions.length,
          0
        ),
        averagePermissionsPerUser:
          securityAnalysis.userPermissions.length > 0
            ? securityAnalysis.userPermissions.reduce((acc, u) => acc + u.permissions.length, 0) /
              securityAnalysis.userPermissions.length
            : 0
      },
      allUsers: securityAnalysis.userPermissions.map((u) => ({
        userName: u.userName,
        loginName: u.loginName,
        isSysAdmin: u.isSysAdmin,
        hasDbOwner: u.hasDbOwner,
        permissionsCount: u.permissions.length,
        permissions: u.permissions,
        roles: u.roles
      })),
      highRiskUsers: highRiskUsers.map((u) => ({
        userName: u.userName,
        loginName: u.loginName,
        riskFactors: [
          u.isSysAdmin && "SysAdmin",
          u.hasDbOwner && "DbOwner",
          u.permissions.length > 10 && "Excessive Permissions"
        ].filter(Boolean),
        permissionsCount: u.permissions.length
      })),
      permissionsDistribution: Array.from(permissionsByType.entries()).map(([permission, count]) => ({
        permission,
        userCount: count
      })),
      securityMetrics: securityAnalysis.securityMetrics,
      recommendations: [
        "Revisar permissões de usuários com acesso excessivo",
        "Implementar princípio do menor privilégio",
        "Remover permissões não utilizadas",
        "Auditar acessos de usuários de alto risco",
        "Considerar implementar roles personalizadas"
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

