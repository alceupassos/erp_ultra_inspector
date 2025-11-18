"use client";
import { useEffect, useState } from "react";

type Obj = { schema_name: string; object_name: string; object_type: "TABLE" | "VIEW" };

export default function Cepalab() {
  const [objects, setObjects] = useState<Obj[]>([]);
  const [filter, setFilter] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [sel, setSel] = useState<Obj | null>(null);
  useEffect(() => { (async () => { const res = await fetch("/api/sgq/list"); const j = await res.json(); setObjects(j.objects || []); })(); }, []);

  async function open(o: Obj) {
    setSel(o); setRows([]);
    const res = await fetch("/api/sgq/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schema: o.schema_name, object: o.object_name, top: 100, server: undefined, port: undefined, user: undefined, password: undefined, database: undefined }) });
    const j = await res.json(); setRows(j.rows || []);
  }

  const filtered = objects.filter(o => (o.schema_name + "." + o.object_name + " " + o.object_type).toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold glow-orange">Sistema CEPALAB (SGQ)</h2>
      <input className="rounded-xl bg-transparent border border-white/10 px-3 py-2 w-full" placeholder="Buscar por schema/objeto" value={filter} onChange={(e) => setFilter(e.target.value)} />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="neu-card rounded-2xl p-4">
          <div className="text-sm font-semibold glow-orange mb-2">Objetos</div>
          <ul className="text-xs space-y-1 max-h-80 overflow-auto">
            {filtered.map((o, i) => (
              <li key={i}>
                <button onClick={() => open(o)} className="text-left w-full px-2 py-1 rounded hover:bg-white/5">
                  <span className="text-[#ff8a1f] mr-2">{o.object_type}</span> {o.schema_name}.{o.object_name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="neu-card rounded-2xl p-4">
          <div className="text-sm font-semibold glow-orange mb-2">Prévia (TOP 100)</div>
          {sel ? (
            <div className="text-xs">
              <div className="mb-2 text-muted-foreground">{sel.schema_name}.{sel.object_name}</div>
              <div className="overflow-auto max-h-80 border border-white/10 rounded">
                <table className="min-w-full text-[11px]">
                  <thead>
                    <tr>
                      {rows[0] && Object.keys(rows[0]).map((c) => (<th key={c} className="px-2 py-1 text-left border-b border-white/10">{c}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, ri) => (
                      <tr key={ri}>
                        {Object.keys(rows[0] || {}).map((c) => (<td key={c} className="px-2 py-1 border-b border-white/5">{String(r[c])}</td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Selecione um objeto para ver a prévia.</div>
          )}
        </div>
      </div>
    </div>
  );
}