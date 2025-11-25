import { NextRequest, NextResponse } from "next/server";
import net from "net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const server = body?.server as string;
    const port = Number(body?.port);
    if (!server || !port) {
      return NextResponse.json({ ok: false, error: "server e port são obrigatórios" }, { status: 400 });
    }

    const ok = await new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      const timeoutMs = 4000;
      let done = false;
      const clean = (result: boolean) => {
        if (done) return;
        done = true;
        try { socket.destroy(); } catch {}
        resolve(result);
      };
      socket.setTimeout(timeoutMs);
      socket.once("connect", () => clean(true));
      socket.once("timeout", () => clean(false));
      socket.once("error", () => clean(false));
      socket.connect(port, server);
    });

    return NextResponse.json({ ok });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}