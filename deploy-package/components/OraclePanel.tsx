"use client";
import { useState } from "react";

type OraclePanelProps = {
  area: string;
  filters?: any;
  kpis?: any;
  sampleRows?: any[];
  metadata?: any;
};

export default function OraclePanel({ area, filters, kpis, sampleRows, metadata }: OraclePanelProps) {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"insights" | "narrative" | "actions">("narrative");
  const [result, setResult] = useState<{ narrative?: string; insights?: string[]; actions?: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");

  async function ask(mode: "insights" | "narrative" | "actions") {
    setLoading(true); setError(null); setTab(mode);
    try {
      const res = await fetch("/api/oracle/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area, filters, kpis, sampleRows, metadata, mode, question })
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || j.details || "Erro Oráculo"); return; }
      setResult({ narrative: j.narrative, insights: j.insights, actions: j.actions });
    } finally { setLoading(false); }
  }

  return (
    <div className="neu-card rounded-2xl p-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold glow-orange">Oráculo (AI)</div>
        <div className="flex gap-2">
          <button className={`px-2 py-1 text-xs rounded glow-border ${tab==='insights'?'bg-primary/30':''}`} onClick={() => ask("insights")}>Insights</button>
          <button className={`px-2 py-1 text-xs rounded glow-border ${tab==='narrative'?'bg-primary/30':''}`} onClick={() => ask("narrative")}>Narrativa</button>
          <button className={`px-2 py-1 text-xs rounded glow-border ${tab==='actions'?'bg-primary/30':''}`} onClick={() => ask("actions")}>Ações</button>
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        <input className="flex-1 rounded-xl bg-transparent border border-white/10 px-3 py-2 text-xs" placeholder="Pergunte ao Oráculo" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <button className="px-3 py-2 text-xs rounded glow-border bg-primary text-primary-foreground" onClick={() => ask(tab)} disabled={loading}>Perguntar</button>
      </div>
      <div className="mt-3 text-xs">
        {loading && <div className="text-muted-foreground">Gerando...</div>}
        {error && <div className="text-red-400">{error}</div>}
        {!loading && !error && result && (
          tab === "narrative" ? (
            <div className="whitespace-pre-wrap">{result.narrative}</div>
          ) : tab === "insights" ? (
            <ul className="space-y-1">{(result.insights||[]).map((i,idx)=>(<li key={idx}>• {i}</li>))}</ul>
          ) : (
            <ul className="space-y-1">{(result.actions||[]).map((a,idx)=>(<li key={idx}>→ {a}</li>))}</ul>
          )
        )}
      </div>
    </div>
  );
}