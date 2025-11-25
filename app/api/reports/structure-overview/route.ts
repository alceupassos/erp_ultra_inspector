import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { inspectSqlServer } from "@/lib/sqlInspector";

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

    // Análise estrutural
    const analysis = await inspectSqlServer({ server, port, user, password, database });

    // Estatísticas adicionais
    const [proceduresResult, functionsResult, schemasResult] = await Promise.all([
      pool.request().query(`
        SELECT s.name AS schema_name, COUNT(*) AS count
        FROM sys.procedures p
        JOIN sys.schemas s ON p.schema_id = s.schema_id
        GROUP BY s.name
      `),
      pool.request().query(`
        SELECT s.name AS schema_name, COUNT(*) AS count
        FROM sys.objects o
        JOIN sys.schemas s ON o.schema_id = s.schema_id
        WHERE o.type = 'FN' OR o.type = 'IF' OR o.type = 'TF'
        GROUP BY s.name
      `),
      pool.request().query(`
        SELECT s.name AS schema_name, COUNT(DISTINCT t.object_id) AS table_count
        FROM sys.tables t
        JOIN sys.schemas s ON t.schema_id = s.schema_id
        GROUP BY s.name
      `)
    ]);

    const totalRows = analysis.tables.reduce((acc, t) => acc + t.rowCount, 0);
    const largestTables = analysis.tables
      .sort((a, b) => b.rowCount - a.rowCount)
      .slice(0, 10)
      .map((t) => ({
        schema: t.schema,
        name: t.name,
        rowCount: t.rowCount,
        foreignKeys: t.foreignKeys.length
      }));

    const mostReferenced = analysis.tables
      .map((t) => ({
        schema: t.schema,
        name: t.name,
        references: analysis.tables.filter((ot) =>
          ot.foreignKeys.some((fk) => fk.referenced_table === `${t.schema}.${t.name}`)
        ).length
      }))
      .sort((a, b) => b.references - a.references)
      .slice(0, 10);

    const report = {
      summary: {
        totalTables: analysis.tables.length,
        totalViews: analysis.tables.filter((t) => t.name.includes("v_")).length,
        totalProcedures: proceduresResult.recordset.reduce((acc: number, r: any) => acc + r.count, 0),
        totalFunctions: functionsResult.recordset.reduce((acc: number, r: any) => acc + r.count, 0),
        totalRows,
        totalSchemas: schemasResult.recordset.length
      },
      distributionBySchema: schemasResult.recordset.map((r: any) => ({
        schema: r.schema_name,
        tableCount: r.table_count
      })),
      largestTables,
      mostReferencedTables: mostReferenced,
      database: analysis.database,
      server: analysis.server,
      port: analysis.port,
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

