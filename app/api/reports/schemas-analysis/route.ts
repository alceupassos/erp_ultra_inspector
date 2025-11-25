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
    const analysis = await inspectSqlServer({ server, port, user, password, database });

    // Agrupar por schema
    const schemasMap = new Map<string, any>();
    
    analysis.tables.forEach((table) => {
      if (!schemasMap.has(table.schema)) {
        schemasMap.set(table.schema, {
          schemaName: table.schema,
          tables: [],
          views: [],
          totalRows: 0,
          totalColumns: 0,
          totalPrimaryKeys: 0,
          totalForeignKeys: 0
        });
      }
      const schema = schemasMap.get(table.schema)!;
      schema.tables.push({
        name: table.name,
        rowCount: table.rowCount,
        columns: table.columns.length,
        primaryKey: table.primaryKey.length,
        foreignKeys: table.foreignKeys.length
      });
      schema.totalRows += table.rowCount;
      schema.totalColumns += table.columns.length;
      schema.totalPrimaryKeys += table.primaryKey.length;
      schema.totalForeignKeys += table.foreignKeys.length;
    });

    // Estatísticas de procedures e functions por schema
    const [proceduresResult, functionsResult] = await Promise.all([
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
        WHERE o.type IN ('FN', 'IF', 'TF')
        GROUP BY s.name
      `)
    ]);

    const proceduresBySchema = new Map(
      proceduresResult.recordset.map((r: any) => [r.schema_name, r.count])
    );
    const functionsBySchema = new Map(
      functionsResult.recordset.map((r: any) => [r.schema_name, r.count])
    );

    const schemasAnalysis = Array.from(schemasMap.values()).map((schema) => ({
      ...schema,
      procedures: proceduresBySchema.get(schema.schemaName) || 0,
      functions: functionsBySchema.get(schema.schemaName) || 0,
      averageRowsPerTable: schema.tables.length > 0 ? schema.totalRows / schema.tables.length : 0,
      averageColumnsPerTable: schema.tables.length > 0 ? schema.totalColumns / schema.tables.length : 0
    }));

    schemasAnalysis.sort((a, b) => b.totalRows - a.totalRows);

    const report = {
      schemas: schemasAnalysis,
      summary: {
        totalSchemas: schemasAnalysis.length,
        totalTables: analysis.tables.length,
        totalRows: schemasAnalysis.reduce((acc, s) => acc + s.totalRows, 0),
        totalProcedures: schemasAnalysis.reduce((acc, s) => acc + s.procedures, 0),
        totalFunctions: schemasAnalysis.reduce((acc, s) => acc + s.functions, 0)
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

