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
      database,
      includeData = false,
      schemaFilter = null
    } = body || {};

    if (!user || !password || !database) {
      return NextResponse.json(
        { error: "user, password e database são obrigatórios" },
        { status: 400 }
      );
    }

    pool = await createConnection(server, Number(port), user, password, database);

    const scripts: { [key: string]: string } = {};

    // Script de criação de todas as tabelas
    const tablesScript = await pool.request().query(`
      SELECT 
        'CREATE TABLE [' + s.name + '].[' + t.name + '] (' + CHAR(13) + CHAR(10) +
        STUFF((
          SELECT ', [' + c.name + '] ' + 
            ty.name + 
            CASE 
              WHEN ty.name IN ('varchar', 'nvarchar', 'char', 'nchar') 
                THEN '(' + CASE WHEN c.max_length = -1 THEN 'MAX' ELSE CAST(c.max_length AS VARCHAR) END + ')'
              WHEN ty.name IN ('decimal', 'numeric')
                THEN '(' + CAST(c.precision AS VARCHAR) + ',' + CAST(c.scale AS VARCHAR) + ')'
              ELSE ''
            END +
            CASE WHEN c.is_nullable = 0 THEN ' NOT NULL' ELSE ' NULL' END +
            CASE WHEN c.is_identity = 1 THEN ' IDENTITY(1,1)' ELSE '' END +
            CASE WHEN OBJECT_DEFINITION(c.default_object_id) IS NOT NULL 
              THEN ' DEFAULT ' + OBJECT_DEFINITION(c.default_object_id)
              ELSE ''
            END
          FROM sys.columns c
          JOIN sys.types ty ON c.user_type_id = ty.user_type_id
          WHERE c.object_id = t.object_id
          ORDER BY c.column_id
          FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') + CHAR(13) + CHAR(10) + ');' AS create_table_script
      FROM sys.tables t
      JOIN sys.schemas s ON t.schema_id = s.schema_id
      WHERE t.is_ms_shipped = 0
        ${schemaFilter ? `AND s.name = '${schemaFilter}'` : ''}
      ORDER BY s.name, t.name
    `);

    scripts.tables = tablesScript.recordset
      .map((r: any) => r.create_table_script)
      .join('\n\n');

    // Script de criação de Primary Keys
    const pkScript = await pool.request().query(`
      SELECT 
        'ALTER TABLE [' + ps.name + '].[' + pt.name + '] ADD CONSTRAINT [' + pk.name + '] PRIMARY KEY ' +
        CASE WHEN i.type_desc = 'CLUSTERED' THEN 'CLUSTERED' ELSE 'NONCLUSTERED' END + ' (' +
        STUFF((
          SELECT ', [' + col.name + ']' + CASE WHEN ic.is_descending_key = 1 THEN ' DESC' ELSE ' ASC' END
          FROM sys.index_columns ic
          JOIN sys.columns col ON ic.object_id = col.object_id AND ic.column_id = col.column_id
          WHERE ic.object_id = pk.parent_object_id AND ic.index_id = pk.unique_index_id
          ORDER BY ic.key_ordinal
          FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') + ');' AS create_pk_script
      FROM sys.key_constraints pk
      JOIN sys.tables pt ON pk.parent_object_id = pt.object_id
      JOIN sys.schemas ps ON pt.schema_id = ps.schema_id
      JOIN sys.indexes i ON pk.parent_object_id = i.object_id AND pk.unique_index_id = i.index_id
      WHERE pk.type = 'PK'
        ${schemaFilter ? `AND ps.name = '${schemaFilter}'` : ''}
      ORDER BY ps.name, pt.name
    `);

    scripts.primaryKeys = pkScript.recordset
      .map((r: any) => r.create_pk_script)
      .join('\n\n');

    // Script de criação de Foreign Keys
    const fkScript = await pool.request().query(`
      SELECT 
        'ALTER TABLE [' + ps.name + '].[' + pt.name + '] ADD CONSTRAINT [' + fk.name + '] FOREIGN KEY (' +
        STUFF((
          SELECT ', [' + pc.name + ']'
          FROM sys.foreign_key_columns fkc
          JOIN sys.columns pc ON fkc.parent_object_id = pc.object_id AND fkc.parent_column_id = pc.column_id
          WHERE fkc.constraint_object_id = fk.object_id
          ORDER BY fkc.constraint_column_id
          FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') + ') REFERENCES [' + rs.name + '].[' + rt.name + '] (' +
        STUFF((
          SELECT ', [' + rc.name + ']'
          FROM sys.foreign_key_columns fkc
          JOIN sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
          WHERE fkc.constraint_object_id = fk.object_id
          ORDER BY fkc.constraint_column_id
          FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') + ');' AS create_fk_script
      FROM sys.foreign_keys fk
      JOIN sys.tables pt ON fk.parent_object_id = pt.object_id
      JOIN sys.schemas ps ON pt.schema_id = ps.schema_id
      JOIN sys.tables rt ON fk.referenced_object_id = rt.object_id
      JOIN sys.schemas rs ON rt.schema_id = rs.schema_id
      ${schemaFilter ? `WHERE ps.name = '${schemaFilter}'` : ''}
      ORDER BY ps.name, pt.name, fk.name
    `);

    scripts.foreignKeys = fkScript.recordset
      .map((r: any) => r.create_fk_script)
      .join('\n\n');

    // Script de criação de Índices
    const indexesScript = await pool.request().query(`
      SELECT 
        'CREATE ' + 
        CASE WHEN i.is_unique = 1 THEN 'UNIQUE ' ELSE '' END +
        i.type_desc + ' INDEX [' + i.name + '] ON [' + s.name + '].[' + t.name + '] (' +
        STUFF((
          SELECT ', [' + col.name + ']' + CASE WHEN ic.is_descending_key = 1 THEN ' DESC' ELSE ' ASC' END
          FROM sys.index_columns ic
          JOIN sys.columns col ON ic.object_id = col.object_id AND ic.column_id = col.column_id
          WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id
          ORDER BY ic.key_ordinal
          FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') + ');' AS create_index_script
      FROM sys.indexes i
      JOIN sys.tables t ON i.object_id = t.object_id
      JOIN sys.schemas s ON t.schema_id = s.schema_id
      WHERE t.is_ms_shipped = 0
        AND i.type > 0
        AND i.is_primary_key = 0
        ${schemaFilter ? `AND s.name = '${schemaFilter}'` : ''}
      ORDER BY s.name, t.name, i.name
    `);

    scripts.indexes = indexesScript.recordset
      .map((r: any) => r.create_index_script)
      .join('\n\n');

    // Script de criação de Views
    const viewsScript = await pool.request().query(`
      SELECT 
        'CREATE VIEW [' + s.name + '].[' + v.name + '] AS' + CHAR(13) + CHAR(10) +
        OBJECT_DEFINITION(v.object_id) + ';' AS create_view_script
      FROM sys.views v
      JOIN sys.schemas s ON v.schema_id = s.schema_id
      WHERE v.is_ms_shipped = 0
        ${schemaFilter ? `AND s.name = '${schemaFilter}'` : ''}
      ORDER BY s.name, v.name
    `);

    scripts.views = viewsScript.recordset
      .map((r: any) => r.create_view_script)
      .join('\n\n');

    // Script de criação de Procedures
    const proceduresScript = await pool.request().query(`
      SELECT 
        'CREATE PROCEDURE [' + s.name + '].[' + p.name + ']' + CHAR(13) + CHAR(10) +
        OBJECT_DEFINITION(p.object_id) + ';' AS create_procedure_script
      FROM sys.procedures p
      JOIN sys.schemas s ON p.schema_id = s.schema_id
      WHERE p.is_ms_shipped = 0
        ${schemaFilter ? `AND s.name = '${schemaFilter}'` : ''}
      ORDER BY s.name, p.name
    `);

    scripts.procedures = proceduresScript.recordset
      .map((r: any) => r.create_procedure_script)
      .join('\n\n');

    // Script de criação de Functions
    const functionsScript = await pool.request().query(`
      SELECT 
        'CREATE FUNCTION [' + s.name + '].[' + o.name + ']' + CHAR(13) + CHAR(10) +
        OBJECT_DEFINITION(o.object_id) + ';' AS create_function_script
      FROM sys.objects o
      JOIN sys.schemas s ON o.schema_id = s.schema_id
      WHERE o.type IN ('FN', 'IF', 'TF', 'FS', 'FT')
        AND o.is_ms_shipped = 0
        ${schemaFilter ? `AND s.name = '${schemaFilter}'` : ''}
      ORDER BY s.name, o.name
    `);

    scripts.functions = functionsScript.recordset
      .map((r: any) => r.create_function_script)
      .join('\n\n');

    // Script completo combinado
    scripts.complete = [
      `-- Script de criação completo para banco ${database}`,
      `-- Gerado em: ${new Date().toISOString()}`,
      `-- Servidor: ${server}:${port}`,
      '',
      '-- ============================================',
      '-- TABELAS',
      '-- ============================================',
      scripts.tables,
      '',
      '-- ============================================',
      '-- PRIMARY KEYS',
      '-- ============================================',
      scripts.primaryKeys,
      '',
      '-- ============================================',
      '-- FOREIGN KEYS',
      '-- ============================================',
      scripts.foreignKeys,
      '',
      '-- ============================================',
      '-- ÍNDICES',
      '-- ============================================',
      scripts.indexes,
      '',
      '-- ============================================',
      '-- VIEWS',
      '-- ============================================',
      scripts.views,
      '',
      '-- ============================================',
      '-- STORED PROCEDURES',
      '-- ============================================',
      scripts.procedures,
      '',
      '-- ============================================',
      '-- FUNCTIONS',
      '-- ============================================',
      scripts.functions
    ].join('\n');

    return NextResponse.json({
      scripts: scripts,
      metadata: {
        database: database,
        server: server,
        port: port,
        exportDate: new Date().toISOString(),
        schemaFilter: schemaFilter || 'all',
        includeData: includeData
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="sql-scripts-${database}-${Date.now()}.json"`
      }
    });

  } catch (err: any) {
    console.error("Erro ao gerar scripts SQL:", err);
    return NextResponse.json(
      {
        error: "Falha ao gerar scripts SQL",
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

