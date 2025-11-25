import { NextResponse } from "next/server";
import { readMdCreds } from "@/lib/mdCreds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const md = readMdCreds();
  if (!md) return NextResponse.json({ error: "MD não encontrado" }, { status: 404 });
  return NextResponse.json({ server: md.server, port: md.port, database: md.database, user: md.user });
}