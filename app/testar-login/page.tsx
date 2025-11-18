"use client";
import { useState } from "react";

export default function TestarLogin() {
  const [server, setServer] = useState("104.234.224.238");
  const [port, setPort] = useState(1445);
  const [user, setUser] = useState("angrax");
  const [password, setPassword] = useState("");
  const [database, setDatabase] = useState("sgq");
  const [logs, setLogs] = useState<string[]>([]);

  const add = (m: string) => setLogs((p) => [...p, m]);

  async function ping() {
    add("Testando porta...");
    const res = await fetch("/api/ping-sql", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ server, port }) });
    const j = await res.json();
    add(j.ok ? "Porta acessível" : `Falha ping: ${j.error || "inacessível"}`);
  }

  async function select1() {
    add("Executando SELECT 1...");
    const res = await fetch("/api/sgq/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ server, port, user, password, database, sql: "SELECT 1 as ok" }) });
    const j = await res.json();
    add(res.ok ? `OK: ${JSON.stringify(j)}` : `Erro: ${j.error || j.details}`);
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold glow-orange">Testar login</h2>
      <div className="grid md:grid-cols-3 gap-3">
        <input className="rounded-xl bg-transparent border border-white/10 px-3 py-2" value={server} onChange={(e) => setServer(e.target.value)} />
        <input className="rounded-xl bg-transparent border border-white/10 px-3 py-2" value={port} onChange={(e) => setPort(Number(e.target.value))} />
        <input className="rounded-xl bg-transparent border border-white/10 px-3 py-2" value={database} onChange={(e) => setDatabase(e.target.value)} />
        <input className="rounded-xl bg-transparent border border-white/10 px-3 py-2" value={user} onChange={(e) => setUser(e.target.value)} />
        <input type="password" className="rounded-xl bg-transparent border border-white/10 px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={ping} className="px-3 py-2 rounded glow-border bg-primary/20 text-[#ff8a1f]">Testar porta</button>
        <button onClick={select1} className="px-3 py-2 rounded glow-border bg-primary text-primary-foreground">SELECT 1</button>
      </div>
      <div className="neu-card rounded-2xl p-4">
        <div className="text-sm font-semibold glow-orange mb-2">Logs</div>
        <ul className="text-xs space-y-1">
          {logs.map((l, i) => (<li key={i}>{l}</li>))}
        </ul>
      </div>
    </div>
  );
}