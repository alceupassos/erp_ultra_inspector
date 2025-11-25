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

    // 2.2 Filegroups e Files
    const filegroups = await pool.request().query(`
      SELECT 
        fg.name AS filegroup_name,
        fg.type_desc AS filegroup_type,
        f.name AS logical_file_name,
        f.physical_name,
        f.size * 8 / 1024 AS size_mb,
        f.max_size,
        f.growth,
        f.is_percent_growth,
        f.type_desc AS file_type
      FROM sys.filegroups fg
      LEFT JOIN sys.database_files f ON fg.data_space_id = f.data_space_id
      ORDER BY fg.name, f.name
    `).catch(() => ({ recordset: [] }));

    // 2.3 Usuários e Permissões
    const logins = await pool.request().query(`
      SELECT 
        name,
        type_desc,
        is_disabled,
        create_date,
        modify_date
      FROM sys.server_principals
      WHERE type IN ('S', 'U', 'G')
        AND name NOT LIKE '##%'
      ORDER BY name
    `).catch(() => ({ recordset: [] }));

    const users = await pool.request().query(`
      SELECT 
        dp.name AS user_name,
        dp.type_desc AS user_type,
        dp.create_date,
        dp.modify_date,
        ISNULL(USER_NAME(dp.default_schema_name), 'dbo') AS default_schema
      FROM sys.database_principals dp
      WHERE dp.type IN ('S', 'U', 'G')
        AND dp.name NOT IN ('dbo', 'guest', 'INFORMATION_SCHEMA', 'sys')
      ORDER BY dp.name
    `).catch(() => ({ recordset: [] }));

    const roles = await pool.request().query(`
      SELECT 
        r.name AS role_name,
        r.type_desc AS role_type,
        m.name AS member_name,
        m.type_desc AS member_type
      FROM sys.database_roles r
      LEFT JOIN sys.database_role_members rm ON r.principal_id = rm.role_principal_id
      LEFT JOIN sys.database_principals m ON rm.member_principal_id = m.principal_id
      WHERE r.name NOT IN ('public')
      ORDER BY r.name, m.name
    `).catch(() => ({ recordset: [] }));

    // 2.4 Jobs (se msdb acessível)
    let jobs = { recordset: [] };
    try {
      jobs = await pool.request().query(`
        SELECT 
          j.name AS job_name,
          j.enabled,
          j.date_created,
          j.date_modified,
          j.description
        FROM msdb.dbo.sysjobs j
        ORDER BY j.name
      `);
    } catch (e) {
      console.warn("msdb não acessível:", e);
    }

    // 3.2 Relacionamentos para Power BI
    const relationships = await pool.request().query(`
      SELECT 
        ps.name AS from_schema,
        pt.name AS from_table,
        pc.name AS from_column,
        rs.name AS to_schema,
        rt.name AS to_table,
        rc.name AS to_column,
        fk.name AS relationship_name
      FROM sys.foreign_keys fk
      JOIN sys.tables pt ON fk.parent_object_id = pt.object_id
      JOIN sys.schemas ps ON pt.schema_id = ps.schema_id
      JOIN sys.tables rt ON fk.referenced_object_id = rt.object_id
      JOIN sys.schemas rs ON rt.schema_id = rs.schema_id
      JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      JOIN sys.columns pc ON fkc.parent_object_id = pc.object_id AND fkc.parent_column_id = pc.column_id
      JOIN sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
      ORDER BY ps.name, pt.name, fk.name
    `).catch(() => ({ recordset: [] }));

    // Compilar tudo em um único objeto seguindo o PLANO_EXPORTACAO_SQL_ULTRA.md
    const completeExport = {
      exportDate: new Date().toISOString(),
      database: database,
      server: server,
      port: port,
      planVersion: "1.0",
      executedPlan: "PLANO_EXPORTACAO_SQL_ULTRA.md",
      
      // FASE 1: Exportação de Schemas e Estrutura
      phase1_schemasAndStructure: {
        schemas: schemas.recordset,
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
          totalFunctions: functions.recordset.length,
          totalColumns: columns.recordset.length,
          totalPrimaryKeys: primaryKeys.recordset.length,
          totalForeignKeys: foreignKeys.recordset.length,
          totalIndexes: indexes.recordset.length
        }
      },
      
      // FASE 2: Exportação de Configurações do SQL Server
      phase2_configurations: {
        serverConfiguration: {
          ...serverConfig.recordset[0],
          version: serverConfig.recordset[0]?.sql_version,
          edition: serverConfig.recordset[0]?.edition,
          productLevel: serverConfig.recordset[0]?.product_level
        },
        databaseConfiguration: {
          ...dbConfig.recordset[0],
          filegroups: filegroups.recordset
        },
        security: {
          logins: logins.recordset,
          users: users.recordset,
          roles: roles.recordset
        },
        maintenance: {
          jobs: jobs.recordset
        }
      },
      
      // FASE 3: Preparação para Power BI
      phase3_powerBI: {
        dataModel: {
          factTables: factTables.recordset,
          dimensionTables: dimensionTables.recordset,
          relationships: relationships.recordset
        },
        connectionString: `Server=${server},${port};Database=${database};User Id=${user};Password=${password};Encrypt=true;TrustServerCertificate=true;`,
        recommendations: {
          indexes: [
            "Considere criar índices columnstore em tabelas fact grandes",
            "Crie índices nas colunas usadas em filtros do Power BI",
            "Considere particionar tabelas fact por data se aplicável"
          ],
          views: [
            "Crie views agregadas para reduzir carga no Power BI",
            "Use views para combinar tabelas relacionadas",
            "Crie views específicas por área de negócio (Vendas, Estoque, Financeiro)"
          ]
        }
      },
      
      // FASE 4: Metadados e Informações Adicionais
      phase4_metadata: {
        exportInfo: {
          exportedBy: "ERP ULTRA Inspector",
          exportMethod: "PLANO_EXPORTACAO_SQL_ULTRA.md",
          timestamp: new Date().toISOString(),
          databaseName: database,
          serverAddress: `${server}:${port}`
        },
        statistics: {
          totalObjects: schemas.recordset.length + tables.recordset.length + views.recordset.length + procedures.recordset.length + functions.recordset.length,
          largestTable: tables.recordset.reduce((max: any, t: any) => (t.row_count || 0) > (max?.row_count || 0) ? t : max, tables.recordset[0] || {}),
          mostReferencedTable: dimensionTables.recordset[0] || null
        }
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

