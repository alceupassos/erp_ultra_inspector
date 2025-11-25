import sql from "mssql";
import { classifyTable } from "./classifier";
import type { AnalysisResult, TableInfo } from "./types";

type ConnectionParams = {
  server: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export async function inspectSqlServer(
  params: ConnectionParams
): Promise<AnalysisResult> {
  const { server, port, user, password, database } = params;

  const config: sql.config = {
    server,
    port,
    user,
    password,
    database,
    options: {
      encrypt: false,
      trustServerCertificate: true
    },
    connectionTimeout: 15000,
    requestTimeout: 15000,
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };

  const pool = await sql.connect(config);

  try {
    await pool.request().query(`USE [${database}]`);

    const tablesResult = await pool.request().query(`
      SELECT 
        t.object_id,
        s.name AS schema_name,
        t.name AS table_name
      FROM sys.tables t
      JOIN sys.schemas s ON t.schema_id = s.schema_id
      ORDER BY s.name, t.name;
    `);

    const rowCountsResult = await pool.request().query(`
      SELECT 
        t.object_id,
        SUM(p.rows) AS row_count
      FROM sys.tables t
      JOIN sys.partitions p ON t.object_id = p.object_id
      WHERE p.index_id IN (0, 1)
      GROUP BY t.object_id;
    `);

    const columnsResult = await pool.request().query(`
      SELECT 
        c.object_id,
        c.column_id,
        c.name AS column_name,
        ty.name AS data_type,
        c.max_length,
        c.is_nullable,
        c.is_identity
      FROM sys.columns c
      JOIN sys.types ty ON c.user_type_id = ty.user_type_id
      ORDER BY c.object_id, c.column_id;
    `);

    const pkResult = await pool.request().query(`
      SELECT 
        kc.parent_object_id AS object_id,
        col.name AS column_name
      FROM sys.key_constraints kc
      JOIN sys.index_columns ic 
        ON kc.parent_object_id = ic.object_id 
        AND kc.unique_index_id = ic.index_id
      JOIN sys.columns col
        ON col.object_id = ic.object_id 
        AND col.column_id = ic.column_id
      WHERE kc.type = 'PK';
    `);

    const fkResult = await pool.request().query(`
      SELECT 
        fk.name AS fk_name,
        fk.parent_object_id,
        fk.referenced_object_id,
        p.name   AS parent_table,
        r.name   AS referenced_table
      FROM sys.foreign_keys fk
      JOIN sys.tables p ON fk.parent_object_id = p.object_id
      JOIN sys.tables r ON fk.referenced_object_id = r.object_id;
    `);

    const rowCounts: Record<number, number> = {};
    rowCountsResult.recordset.forEach((r: any) => {
      rowCounts[r.object_id] = r.row_count;
    });

    const columnsByTable: Record<number, any[]> = {};
    columnsResult.recordset.forEach((c: any) => {
      if (!columnsByTable[c.object_id]) columnsByTable[c.object_id] = [];
      columnsByTable[c.object_id].push(c);
    });

    const pkByTable: Record<number, string[]> = {};
    pkResult.recordset.forEach((r: any) => {
      if (!pkByTable[r.object_id]) pkByTable[r.object_id] = [];
      pkByTable[r.object_id].push(r.column_name);
    });

    const fkByTable: Record<number, any[]> = {};
    fkResult.recordset.forEach((fk: any) => {
      if (!fkByTable[fk.parent_object_id]) fkByTable[fk.parent_object_id] = [];
      fkByTable[fk.parent_object_id].push(fk);
    });

    const tables: TableInfo[] = tablesResult.recordset.map((t: any) => {
      const cols = columnsByTable[t.object_id] || [];
      const pkCols = pkByTable[t.object_id] || [];
      const fks = fkByTable[t.object_id] || [];
      const rowCount = rowCounts[t.object_id] || 0;
      const purpose = classifyTable(t.table_name);

      return {
        schema: t.schema_name,
        name: t.table_name,
        objectId: t.object_id,
        rowCount,
        primaryKey: pkCols,
        columns: cols.map((c: any) => ({
          column_name: c.column_name,
          data_type: c.data_type,
          max_length: c.max_length,
          is_nullable: !!c.is_nullable,
          is_identity: !!c.is_identity
        })),
        foreignKeys: fks.map((fk: any) => ({
          fk_name: fk.fk_name,
          parent_table: fk.parent_table,
          referenced_table: fk.referenced_table
        })),
        purpose
      };
    });

    return {
      server,
      port,
      database,
      tables
    };
  } finally {
    pool.close();
  }
}
