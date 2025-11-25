import { NextResponse } from "next/server";
import sql from "mssql";
import { readMdCreds } from "@/lib/mdCreds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const md = readMdCreds();
    if (!md) return NextResponse.json({ error: "Credenciais MD não encontradas" }, { status: 400 });
    const config: sql.config = {
      server: md.server, port: md.port, user: md.user, password: md.password, database: md.database,
      options: { encrypt: false, trustServerCertificate: true }, connectionTimeout: 15000, requestTimeout: 15000,
      pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
    };
    const pool = await sql.connect(config);
    const tables = await pool.request().query(`
      SELECT s.name AS schema_name, t.name AS object_name, 'TABLE' AS object_type
      FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
      UNION ALL
      SELECT s.name AS schema_name, v.name AS object_name, 'VIEW' AS object_type
      FROM sys.views v JOIN sys.schemas s ON v.schema_id = s.schema_id
      ORDER BY schema_name, object_name;
    `);
    await pool.close();
    return NextResponse.json({ md: { ...md, password: md.password ? "[fornecida]" : undefined }, objects: tables.recordset });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}