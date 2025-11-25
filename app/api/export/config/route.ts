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

    // Configurações do Servidor
    const serverConfig = await pool.request().query(`
      SELECT 
        @@VERSION AS sql_version,
        SERVERPROPERTY('ProductVersion') AS product_version,
        SERVERPROPERTY('ProductLevel') AS product_level,
        SERVERPROPERTY('Edition') AS edition,
        SERVERPROPERTY('EngineEdition') AS engine_edition,
        SERVERPROPERTY('IsClustered') AS is_clustered,
        SERVERPROPERTY('IsIntegratedSecurityOnly') AS is_integrated_security_only,
        SERVERPROPERTY('Collation') AS server_collation,
        (SELECT value_in_use FROM sys.configurations WHERE name = 'max server memory (MB)') AS max_memory_mb,
        (SELECT value_in_use FROM sys.configurations WHERE name = 'min server memory (MB)') AS min_memory_mb,
        (SELECT value_in_use FROM sys.configurations WHERE name = 'max degree of parallelism') AS max_dop,
        (SELECT value_in_use FROM sys.configurations WHERE name = 'cost threshold for parallelism') AS cost_threshold_parallelism
    `);

    // Configurações do Banco de Dados
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
        is_auto_create_stats_on,
        is_auto_update_stats_on,
        is_read_only,
        is_encrypted,
        user_access_desc,
        state_desc
      FROM sys.databases
      WHERE name = @database
    `);

    // Filegroups e Files
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
    `);

    // Logins e Usuários
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
    `);

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
    `);

    // Roles e Permissões
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
    `);

    // SQL Server Agent Jobs
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
      console.warn("Não foi possível acessar msdb:", e);
    }

    // Configurações de Backup
    let backupConfig = { recordset: [] };
    try {
      const backupRequest = pool.request();
      backupRequest.input('database', sql.NVarChar, database);
      backupConfig = await backupRequest.query(`
        SELECT 
          database_name,
          backup_start_date,
          backup_finish_date,
          type,
          backup_size / 1024 / 1024 AS backup_size_mb,
          recovery_model,
          is_copy_only
        FROM (
          SELECT TOP 10
            database_name,
            backup_start_date,
            backup_finish_date,
            CASE type
              WHEN 'D' THEN 'Full'
              WHEN 'I' THEN 'Differential'
              WHEN 'L' THEN 'Log'
              ELSE 'Other'
            END AS type,
            backup_size,
            recovery_model,
            is_copy_only
          FROM msdb.dbo.backupset
          WHERE database_name = @database
          ORDER BY backup_start_date DESC
        ) AS recent_backups
      `);
    } catch (e) {
      console.warn("Não foi possível acessar histórico de backups:", e);
    }

    // Configurações de TDE (se habilitado)
    let tdeConfig = { recordset: [] };
    try {
      const tdeRequest = pool.request();
      tdeRequest.input('database', sql.NVarChar, database);
      tdeConfig = await tdeRequest.query(`
        SELECT 
          database_id,
          encryption_state,
          encryption_state_desc,
          key_algorithm,
          key_length,
          encryptor_type
        FROM sys.dm_database_encryption_keys
        WHERE database_id = DB_ID(@database)
      `);
    } catch (e) {
      console.warn("Não foi possível verificar TDE:", e);
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      server: {
        address: server,
        port: port,
        database: database
      },
      serverConfiguration: serverConfig.recordset[0] || {},
      databaseConfiguration: dbConfig.recordset[0] || {},
      filegroups: filegroups.recordset || [],
      security: {
        logins: logins.recordset || [],
        users: users.recordset || [],
        roles: roles.recordset || []
      },
      maintenance: {
        jobs: jobs.recordset || [],
        recentBackups: backupConfig.recordset || [],
        tde: tdeConfig.recordset[0] || null
      }
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="sql-config-export-${database}-${Date.now()}.json"`
      }
    });

  } catch (err: any) {
    console.error("Erro ao exportar configurações:", err);
    return NextResponse.json(
      {
        error: "Falha ao exportar configurações",
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

