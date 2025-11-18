import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { server, port, user, password, database, sql: sqlText } = body || {};
    if (!server || !port || !user || !database || (!sqlText && (!body.schema || !body.object))) {
      return NextResponse.json({ error: "Parâmetros insuficientes" }, { status: 400 });
    }
    const config: sql.config = {
      server, port: Number(port), user, password, database,
      options: { encrypt: false, trustServerCertificate: true }, connectionTimeout: 15000, requestTimeout: 15000,
      pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
    };
    const pool = await sql.connect(config);
    let query = sqlText as string;
    if (!query) {
      const schema = body.schema as string; const object = body.object as string;
      const top = Number(body.top ?? 100);
      query = `SELECT TOP(${top}) * FROM [${schema}].[${object}]`;
    }
    const result = await pool.request().query(query);
    await pool.close();
    return NextResponse.json({ rows: result.recordset, count: result.recordset.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}