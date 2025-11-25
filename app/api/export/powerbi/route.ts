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

    // Identificar tabelas fact (fatos) - geralmente têm muitas linhas e FKs
    const factTables = await pool.request().query(`
      SELECT 
        s.name AS schema_name,
        t.name AS table_name,
        p.rows AS row_count,
        (SELECT COUNT(*) FROM sys.foreign_keys fk 
         WHERE fk.parent_object_id = t.object_id) AS foreign_key_count,
        (SELECT COUNT(*) FROM sys.indexes i 
         WHERE i.object_id = t.object_id AND i.type > 0) AS index_count
      FROM sys.tables t
      JOIN sys.schemas s ON t.schema_id = s.schema_id
      JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0,1)
      WHERE t.is_ms_shipped = 0
        AND p.rows > 1000
      ORDER BY p.rows DESC
    `);

    // Identificar tabelas dimension (dimensões) - geralmente têm poucas linhas
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

    // Mapear relacionamentos (star schema)
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
    `);

    // Views recomendadas para Power BI
    const views = await pool.request().query(`
      SELECT 
        s.name AS schema_name,
        v.name AS view_name,
        v.create_date,
        v.modify_date,
        OBJECT_DEFINITION(v.object_id) AS view_definition
      FROM sys.views v
      JOIN sys.schemas s ON v.schema_id = s.schema_id
      WHERE v.is_ms_shipped = 0
      ORDER BY s.name, v.name
    `);

    // Colunas com tipos de dados importantes para Power BI
    const keyColumns = await pool.request().query(`
      SELECT 
        s.name AS schema_name,
        t.name AS table_name,
        c.name AS column_name,
        ty.name AS data_type,
        c.max_length,
        c.is_nullable,
        c.is_identity,
        CASE 
          WHEN ty.name IN ('date', 'datetime', 'datetime2', 'smalldatetime') THEN 'Date'
          WHEN ty.name IN ('int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric', 'float', 'real', 'money', 'smallmoney') THEN 'Numeric'
          WHEN ty.name IN ('varchar', 'nvarchar', 'char', 'nchar', 'text', 'ntext') THEN 'Text'
          WHEN ty.name = 'bit' THEN 'Boolean'
          ELSE 'Other'
        END AS powerbi_type
      FROM sys.tables t
      JOIN sys.schemas s ON t.schema_id = s.schema_id
      JOIN sys.columns c ON t.object_id = c.object_id
      JOIN sys.types ty ON c.user_type_id = ty.user_type_id
      WHERE t.is_ms_shipped = 0
      ORDER BY s.name, t.name, c.column_id
    `);

    // Gerar string de conexão para Power BI
    const connectionString = `Server=${server},${port};Database=${database};User Id=${user};Password=${password};Encrypt=true;TrustServerCertificate=true;`;

    // Gerar views SQL recomendadas para Power BI
    const powerBiViews = factTables.recordset.map((fact: any) => {
      return {
        viewName: `v_PowerBI_${fact.schema_name}_${fact.table_name}`,
        schema: fact.schema_name,
        baseTable: fact.table_name,
        sql: `CREATE VIEW [${fact.schema_name}].[v_PowerBI_${fact.table_name}] AS
SELECT * FROM [${fact.schema_name}].[${fact.table_name}]
-- Adicione filtros, agregações ou joins conforme necessário para Power BI
`
      };
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      database: database,
      server: server,
      port: port,
      connectionString: connectionString,
      dataModel: {
        factTables: factTables.recordset || [],
        dimensionTables: dimensionTables.recordset || [],
        relationships: relationships.recordset || []
      },
      views: {
        existing: views.recordset || [],
        recommended: powerBiViews
      },
      columns: keyColumns.recordset || [],
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
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="powerbi-export-${database}-${Date.now()}.json"`
      }
    });

  } catch (err: any) {
    console.error("Erro ao exportar para Power BI:", err);
    return NextResponse.json(
      {
        error: "Falha ao exportar para Power BI",
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

