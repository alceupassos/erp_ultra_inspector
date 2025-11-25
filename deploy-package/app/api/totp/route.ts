import { NextResponse } from "next/server";
import { authenticator } from "otplib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const secret = process.env.TOTP_SECRET || "JBSWY3DPEHPK3PXP";
  const code = authenticator.generate(secret);
  return NextResponse.json({ code });
}