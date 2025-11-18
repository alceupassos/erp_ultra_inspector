"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function AuthErrorPage() {
  const params = useSearchParams();
  const err = params.get("error") || "Unknown";
  const [creds, setCreds] = useState<{ server: string; port: number; database: string; user: string; password?: string } | null>(null);
  const [form, setForm] = useState<{ server: string; port: number; database: string; user: string; password: string }>({ server: "", port: 1445, database: "", user: "", password: "" });
  const [msg, setMsg] = useState<string>("");
  const router = useRouter();
  useEffect(() => { (async () => { const r = await fetch("/api/creds"); if (r.ok) { const j = await r.json(); setCreds(j); setForm({ server: j.server, port: j.port, database: j.database, user: j.user, password: "" }); } })(); }, []);
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="neu-card rounded-2xl p-6">
        <div className="text-lg font-semibold glow-orange">Erro de autenticação</div>
        <div className="text-sm text-muted-foreground mt-2">{err}</div>
      </div>
      <div className="neu-card rounded-2xl p-6 mt-4">
        <div className="text-sm font-semibold glow-orange">Contexto de conexão</div>
        {creds ? (
          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
            <div>Servidor</div><div className="text-[#ff8a1f]">{creds.server}</div>
            <div>Porta</div><div className="text-[#ff8a1f]">{creds.port}</div>
            <div>Banco</div><div className="text-[#ff8a1f]">{creds.database}</div>
            <div>Usuário</div><div className="text-[#ff8a1f]">{creds.user}</div>
            <div>Senha (local)</div><div className="text-[#ff8a1f]">{creds.password ? creds.password : "[não armazenada]"}</div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground mt-2">Credenciais do md não disponíveis</div>
        )}
      </div>
      <div className="neu-card rounded-2xl p-6 mt-4">
        <div className="text-sm font-semibold glow-orange">Redigitar credenciais (salvar no .md)</div>
        <div className="grid md:grid-cols-2 gap-2 mt-2">
          <input className="rounded-xl bg-transparent border border-white/10 px-3 py-2" placeholder="Servidor" value={form.server} onChange={(e) => setForm({ ...form, server: e.target.value })} />
          <input className="rounded-xl bg-transparent border border-white/10 px-3 py-2" placeholder="Porta" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} />
          <input className="rounded-xl bg-transparent border border-white/10 px-3 py-2" placeholder="Database" value={form.database} onChange={(e) => setForm({ ...form, database: e.target.value })} />
          <input className="rounded-xl bg-transparent border border-white/10 px-3 py-2" placeholder="Usuário" value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} />
          <input className="rounded-xl bg-transparent border border-white/10 px-3 py-2" placeholder="Senha (local)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div className="flex gap-2 mt-3">
          <button
            className="px-3 py-2 rounded glow-border bg-primary text-primary-foreground"
            onClick={async () => {
              setMsg("");
              const res = await fetch("/api/creds/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
              const j = await res.json();
              if (res.ok) {
                router.push("/landing");
              } else {
                setMsg(`Erro: ${j.error || j.details}`);
              }
            }}
          >Salvar</button>
          {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
        </div>
      </div>
    </div>
  );
}