import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function createConnection(
  server: string,
  port: number,
  user: string,
  password: string,
  database: string
): Promise<sql.ConnectionPool> {
  const configs = [
    {
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
      requestTimeout: 30000,
      pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
    },
    {
      server,
      port,
      user,
      password,
      database,
      options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
      },
      connectionTimeout: 15000,
      requestTimeout: 30000,
      pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
    },
    {
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
      requestTimeout: 30000,
      pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
    }
  ];

  for (const config of configs) {
    try {
      const pool = await sql.connect(config);
      await pool.request().query("SELECT 1");
      return pool;
    } catch (error) {
      continue;
    }
  }

  throw new Error("Não foi possível conectar ao SQL Server");
}

export async function POST(req: NextRequest) {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    const body = await req.json().catch(() => ({}));
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

    pool = await createConnection(server, Number(port), user, password, database);

    // Listar Schemas
    const schemas = await pool.request().query(`
      SELECT 
        s.name AS schema_name,
        s.schema_id,
        USER_NAME(s.principal_id) AS owner
      FROM sys.schemas s
      WHERE s.name NOT IN ('sys', 'information_schema', 'guest')
      ORDER BY s.name
    `);

    // Listar Tabelas
    const tables = await pool.request().query(`
      SELECT 
        s.name AS schema_name,
        t.name AS table_name,
        t.object_id,
        (SELECT SUM(p.rows) FROM sys.partitions p WHERE p.object_id = t.object_id AND p.index_id IN (0,1)) AS row_count,
        t.create_date,
        t.modify_date
      FROM sys.tables t
      JOIN sys.schemas s ON t.schema_id = s.schema_id
      WHERE t.is_ms_shipped = 0
      ORDER BY s.name, t.name
    `);

    // Listar Views
    const views = await pool.request().query(`
      SELECT 
        s.name AS schema_name,
        v.name AS view_name,
        v.object_id,
        v.create_date,
        v.modify_date
      FROM sys.views v
      JOIN sys.schemas s ON v.schema_id = s.schema_id
      WHERE v.is_ms_shipped = 0
      ORDER BY s.name, v.name
    `);

    // Agrupar por schema
    const schemasData = schemas.recordset.map((schema: any) => {
      const schemaTables = tables.recordset.filter((t: any) => t.schema_name === schema.schema_name);
      const schemaViews = views.recordset.filter((v: any) => v.schema_name === schema.schema_name);
      
      return {
        ...schema,
        tables: schemaTables,
        views: schemaViews,
        tableCount: schemaTables.length,
        viewCount: schemaViews.length
      };
    });

    return NextResponse.json({
      schemas: schemasData,
      summary: {
        totalSchemas: schemas.recordset.length,
        totalTables: tables.recordset.length,
        totalViews: views.recordset.length
      }
    });

  } catch (err: any) {
    console.error("Erro ao listar schemas e tabelas:", err);
    return NextResponse.json(
      {
        error: "Falha ao listar schemas e tabelas",
        details: err?.message ?? String(err)
      },
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

