import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskPII(text: string) {
  return text
    .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, "[CPF]")
    .replace(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, "[CNPJ]")
    .replace(/\b[\w.-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[EMAIL]")
    .replace(/\b\+?\d{2,3}\s?\d{4,5}-\d{4}\b/g, "[PHONE]");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (process.env.ORACLE_ENABLED === "false") {
      return NextResponse.json({ insights: [], narrative: "Oráculo desativado", actions: [], confidence: 0.0 });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.ORACLE_MODEL || "gpt-4o-mini";
    const timeoutMs = Number(process.env.ORACLE_TIMEOUT || 20000);
    if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY ausente" }, { status: 400 });

    const { area, filters, kpis, sampleRows, metadata, mode, question } = body || {};
    const safeRows = Array.isArray(sampleRows)
      ? sampleRows.slice(0, 50).map((r: any) => JSON.stringify(r)).map(maskPII)
      : [];

    const prompt = `Você é um oráculo de dados especializado na área: ${area}.
Filtros atuais: ${JSON.stringify(filters)}
KPIs: ${JSON.stringify(kpis)}
Metadados: ${JSON.stringify(metadata)}
Amostra (mascarada):\n${safeRows.join("\n")}\n
Modo: ${mode}. ${question ? `Pergunta: ${question}` : ""}
Responda com insights objetivos, narrativa executiva e ações práticas com impacto/risco/esforço.`;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model, input: prompt }),
      signal: controller.signal
    }).catch((e) => ({ ok: false, status: 500, statusText: String(e) } as any));
    clearTimeout(id);

    if (!res.ok) return NextResponse.json({ error: `Falha Oráculo: ${res.status} ${res.statusText}` }, { status: 500 });
    const json = await res.json();
    const text = json.output?.[0]?.content?.[0]?.text || json.content?.[0]?.text || "";
    return NextResponse.json({ insights: [], narrative: text, actions: [], confidence: 0.7 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}