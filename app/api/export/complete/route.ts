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

    // 1. EXPORTAÇÃO DE SCHEMAS E ESTRUTURA
    const schemas = await pool.request().query(`
      SELECT 
        s.name AS schema_name,
        s.schema_id,
        USER_NAME(s.principal_id) AS owner
      FROM sys.schemas s
      WHERE s.name NOT IN ('sys', 'information_schema', 'guest')
      ORDER BY s.name
    `);

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

    const columns = await pool.request().query(`
      SELECT 
        s.name AS schema_name,
        t.name AS table_name,
        c.name AS column_name,
        c.column_id,
        ty.name AS data_type,
        c.max_length,
        c.precision,
        c.scale,
        c.is_nullable,
        c.is_identity,
        c.is_computed,
        OBJECT_DEFINITION(c.default_object_id) AS default_value
      FROM sys.tables t
      JOIN sys.schemas s ON t.schema_id = s.schema_id
      JOIN sys.columns c ON t.object_id = c.object_id
      JOIN sys.types ty ON c.user_type_id = ty.user_type_id
      WHERE t.is_ms_shipped = 0
      ORDER BY s.name, t.name, c.column_id
    `);

    const primaryKeys = await pool.request().query(`
      SELECT 
        s.name AS schema_name,
        t.name AS table_name,
        kc.name AS constraint_name,
        col.name AS column_name,
        ic.key_ordinal
      FROM sys.tables t
      JOIN sys.schemas s ON t.schema_id = s.schema_id
      JOIN sys.key_constraints kc ON t.object_id = kc.parent_object_id
      JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
      JOIN sys.columns col ON ic.object_id = col.object_id AND ic.column_id = col.column_id
      WHERE kc.type = 'PK'
      ORDER BY s.name, t.name, ic.key_ordinal
    `);

    const foreignKeys = await pool.request().query(`
      SELECT 
        ps.name AS parent_schema,
        pt.name AS parent_table,
        rs.name AS referenced_schema,
        rt.name AS referenced_table,
        fk.name AS fk_name,
        pc.name AS parent_column,
        rc.name AS referenced_column,
        fkc.constraint_column_id
      FROM sys.foreign_keys fk
      JOIN sys.tables pt ON fk.parent_object_id = pt.object_id
      JOIN sys.schemas ps ON pt.schema_id = ps.schema_id
      JOIN sys.tables rt ON fk.referenced_object_id = rt.object_id
      JOIN sys.schemas rs ON rt.schema_id = rs.schema_id
      JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      JOIN sys.columns pc ON fkc.parent_object_id = pc.object_id AND fkc.parent_column_id = pc.column_id
      JOIN sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
      ORDER BY ps.name, pt.name, fk.name, fkc.constraint_column_id
    `);

    const indexes = await pool.request().query(`
      SELECT 
        s.name AS schema_name,
        t.name AS table_name,
        i.name AS index_name,
        i.type_desc AS index_type,
        i.is_unique,
        i.is_primary_key,
        col.name AS column_name,
        ic.key_ordinal,
        ic.is_descending_key
      FROM sys.tables t
      JOIN sys.schemas s ON t.schema_id = s.schema_id
      JOIN sys.indexes i ON t.object_id = i.object_id
      JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      JOIN sys.columns col ON ic.object_id = col.object_id AND ic.column_id = col.column_id
      WHERE t.is_ms_shipped = 0
        AND i.type_desc IN ('CLUSTERED', 'NONCLUSTERED')
      ORDER BY s.name, t.name, i.name, ic.key_ordinal
    `);

    const views = await pool.request().query(`
      SELECT 
        s.name AS schema_name,
        v.name AS view_name,
        v.object_id,
        v.create_date,
        v.modify_date,
        OBJECT_DEFINITION(v.object_id) AS view_definition
      FROM sys.views v
      JOIN sys.schemas s ON v.schema_id = s.schema_id
      WHERE v.is_ms_shipped = 0
      ORDER BY s.name, v.name
    `);

    const procedures = await pool.request().query(`
      SELECT 
        s.name AS schema_name,
        p.name AS procedure_name,
        p.object_id,
        p.create_date,
        p.modify_date,
        OBJECT_DEFINITION(p.object_id) AS procedure_definition
      FROM sys.procedures p
      JOIN sys.schemas s ON p.schema_id = s.schema_id
      WHERE p.is_ms_shipped = 0
      ORDER BY s.name, p.name
    `);

    const functions = await pool.request().query(`
      SELECT 
        s.name AS schema_name,
        o.name AS function_name,
        o.object_id,
        o.type_desc AS function_type,
        o.create_date,
        o.modify_date,
        OBJECT_DEFINITION(o.object_id) AS function_definition
      FROM sys.objects o
      JOIN sys.schemas s ON o.schema_id = s.schema_id
      WHERE o.type IN ('FN', 'IF', 'TF', 'FS', 'FT')
        AND o.is_ms_shipped = 0
      ORDER BY s.name, o.name
    `);

    // 2. CONFIGURAÇÕES DO SERVIDOR
    const serverConfig = await pool.request().query(`
      SELECT 
        @@VERSION AS sql_version,
        SERVERPROPERTY('ProductVersion') AS product_version,
        SERVERPROPERTY('ProductLevel') AS product_level,
        SERVERPROPERTY('Edition') AS edition,
        SERVERPROPERTY('EngineEdition') AS engine_edition,
        SERVERPROPERTY('IsClustered') AS is_clustered,
        SERVERPROPERTY('Collation') AS server_collation
    `);

    const dbConfigRequest = pool.request();
    dbConfigRequest.input('database', sql.NVarChar, database);
    const dbConfig = await dbConfigRequest.query(`
      SELECT 
        name,
        database_id,
        create_date,
        collation_name,
        recovery_model_desc,
        compatibility_level,
        is_auto_close_on,
        is_auto_shrink_on,
        is_read_only,
        is_encrypted,
        user_access_desc,
        state_desc
      FROM sys.databases
      WHERE name = @database
    `).catch(() => ({ recordset: [] }));

    // 3. PREPARAÇÃO PARA POWER BI
    const factTables = await pool.request().query(`
      SELECT 
        s.name AS schema_name,
        t.name AS table_name,
        p.rows AS row_count,
        (SELECT COUNT(*) FROM sys.foreign_keys fk 
         WHERE fk.parent_object_id = t.object_id) AS foreign_key_count
      FROM sys.tables t
      JOIN sys.schemas s ON t.schema_id = s.schema_id
      JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0,1)
      WHERE t.is_ms_shipped = 0
        AND p.rows > 1000
      ORDER BY p.rows DESC
    `);

    const dimensionTables = await pool.request().query(`
      SELECT 
        s.name AS schema_name,
        t.name AS table_name,
        p.rows AS row_count,
        (SELECT COUNT(*) FROM sys.foreign_keys fk 
         WHERE fk.referenced_object_id = t.object_id) AS referenced_by_count
      FROM sys.tables t
      JOIN sys.schemas s ON t.schema_id = s.schema_id
      JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0,1)
      WHERE t.is_ms_shipped = 0
        AND p.rows < 10000
        AND (SELECT COUNT(*) FROM sys.foreign_keys fk 
             WHERE fk.referenced_object_id = t.object_id) > 0
      ORDER BY referenced_by_count DESC, p.rows DESC
    `);

    // Compilar tudo em um único objeto
    const completeExport = {
      exportDate: new Date().toISOString(),
      database: database,
      server: server,
      port: port,
      
      // Fase 1: Schemas e Estrutura
      schemas: {
        list: schemas.recordset,
        tables: tables.recordset.map((t: any) => ({
          ...t,
          columns: columns.recordset.filter((c: any) => 
            c.schema_name === t.schema_name && c.table_name === t.table_name
          ),
          primaryKeys: primaryKeys.recordset.filter((pk: any) => 
            pk.schema_name === t.schema_name && pk.table_name === t.table_name
          ),
          foreignKeys: foreignKeys.recordset.filter((fk: any) => 
            fk.parent_schema === t.schema_name && fk.parent_table === t.table_name
          ),
          indexes: indexes.recordset.filter((idx: any) => 
            idx.schema_name === t.schema_name && idx.table_name === t.table_name
          )
        })),
        views: views.recordset,
        procedures: procedures.recordset,
        functions: functions.recordset,
        summary: {
          totalSchemas: schemas.recordset.length,
          totalTables: tables.recordset.length,
          totalViews: views.recordset.length,
          totalProcedures: procedures.recordset.length,
          totalFunctions: functions.recordset.length
        }
      },
      
      // Fase 2: Configurações
      configuration: {
        server: serverConfig.recordset[0] || {},
        database: dbConfig.recordset[0] || {}
      },
      
      // Fase 3: Power BI
      powerBI: {
        factTables: factTables.recordset,
        dimensionTables: dimensionTables.recordset,
        connectionString: `Server=${server},${port};Database=${database};User Id=${user};Password=${password};Encrypt=true;TrustServerCertificate=true;`
      }
    };

    return NextResponse.json(completeExport, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="complete-export-${database}-${Date.now()}.json"`
      }
    });

  } catch (err: any) {
    console.error("Erro ao exportar completo:", err);
    return NextResponse.json(
      {
        error: "Falha ao exportar dados completos",
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

