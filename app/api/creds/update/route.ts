import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { server, port, database, user, password } = body || {};
    if (!server || !port || !database || !user) {
      return NextResponse.json({ error: "Campos obrigatórios: server, port, database, user" }, { status: 400 });
    }
    const content = `# Conexão SQL Server — SGQ\n\nServidor: ${server}\nPorta: ${port}\nDatabase: ${database}\nUsuário: ${user}\nSenha: ${password ?? ""}\n\nMSSQL_SERVER=${server}\nMSSQL_PORT=${port}\nMSSQL_DATABASE=${database}\nMSSQL_USER=${user}\nMSSQL_PASSWORD=${password ?? ""}\n`;
    const file = path.join(process.cwd(), "docs", "conexao-sql-sgc.md");
    fs.writeFileSync(file, content, "utf-8");
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}