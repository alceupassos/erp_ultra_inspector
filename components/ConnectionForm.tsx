"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  onAnalysis: (data: any) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  onLog?: (msg: string, type?: "info" | "error" | "success") => void;
};

export function ConnectionForm({ onAnalysis, loading, setLoading, onLog }: Props) {
  const [user, setUser] = useState("angrax");
  const [password, setPassword] = useState("");
  const [database, setDatabase] = useState("sgq");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !password || !database) return;
    setLoading(true);
    setError(null);
    onLog?.("Testando porta 1445...", "info");
    try {
      const ping = await fetch("/api/ping-sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server: "104.234.224.238", port: 1445 })
      }).then((r) => r.json());
      if (!ping?.ok) {
        const msg = "Porta 1445 inacessível. Verifique firewall e NAT.";
        setError(msg);
        onLog?.(msg, "error");
        setLoading(false);
        return;
      }
      onLog?.("Porta 1445 acessível", "success");
    } catch {
      const msg = "Falha ao testar porta 1445.";
      onLog?.(msg, "error");
    }
    onLog?.("Conectando ao SQL Server...", "info");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          server: "104.234.224.238",
          port: 1445,
          user,
          password,
          database
        })
      });

      const json = await res.json();
      if (!res.ok) {
        const message = json?.details || json?.error || "Erro ao analisar banco.";
        setError(message);
        onAnalysis({ error: message });
        onLog?.(message, "error");
      } else {
        onAnalysis(json);
        onLog?.("Análise concluída", "success");
        if (json?.connectionSecurity === "insecure") {
          onLog?.("Conexão sem TLS/SSL (TrustServerCertificate). Gabriel pode exigir certificado TLS válido no SQL Server.", "info");
        } else if (json?.connectionSecurity === "tls") {
          onLog?.("Conexão segura via TLS/SSL.", "success");
        }
      }
    } finally {
      setLoading(false);
      onLog?.("Conexão encerrada", "info");
    }
  }

  function generateMd() {
    const server = "104.234.224.238";
    const port = 1445;
    const content = `# Conexão SQL Server — Angra DB Manager\n\n## Credenciais\n- Servidor: ${server}\n- Porta: ${port}\n- Database: ${database}\n- Usuário: ${user}\n- Senha: ${password ? "[fornecida]" : "[preencher]"}\n\n## Variáveis de ambiente (.env.local)\nMSSQL_SERVER=${server}\nMSSQL_PORT=${port}\nMSSQL_DATABASE=${database}\nMSSQL_USER=${user}\nMSSQL_PASSWORD=${password || ""}\n\n## Node (mssql) exemplo\n\n\`\`\`ts\nimport sql from 'mssql'\nconst config = { server: process.env.MSSQL_SERVER, port: Number(process.env.MSSQL_PORT), user: process.env.MSSQL_USER, password: process.env.MSSQL_PASSWORD, database: process.env.MSSQL_DATABASE, options: { encrypt: false, trustServerCertificate: true }, connectionTimeout: 15000, requestTimeout: 15000 }\nasync function main(){ const pool = await sql.connect(config); const tables = await pool.request().query("SELECT s.name AS schema_name, t.name AS table_name FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id ORDER BY s.name, t.name"); const views = await pool.request().query("SELECT s.name AS schema_name, v.name AS view_name FROM sys.views v JOIN sys.schemas s ON v.schema_id = s.schema_id ORDER BY s.name, v.name"); console.log(tables.recordset.length, views.recordset.length); pool.close(); }\nmain()\n\`\`\`\n\n## SQL para listar\n- Tabelas: \n\`SELECT s.name AS schema_name, t.name AS table_name FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id ORDER BY s.name, t.name;\`\n- Views: \n\`SELECT s.name AS schema_name, v.name AS view_name FROM sys.views v JOIN sys.schemas s ON v.schema_id = s.schema_id ORDER BY s.name, v.name;\`\n`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conexao-sql-${database || 'database'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onLog?.("Arquivo .md de conexão gerado", "success");
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      {error && (
        <div role="alert" className="rounded-xl border border-red-500/40 bg-red-900/20 text-red-200 p-3 glow-border">
          {error}
          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
            <div>Servidor</div><div>104.234.224.238</div>
            <div>Porta</div><div>1445</div>
            <div>Banco</div><div>{database || ""}</div>
            <div>Usuário</div><div>{user || ""}</div>
          </div>
        </div>
      )}
      <div className="space-y-1">
        <Label>Servidor</Label>
        <Input value="104.234.224.238" disabled />
      </div>
      <div className="space-y-1">
        <Label>Porta</Label>
        <Input value="1445" disabled />
      </div>
      <div className="space-y-1">
        <Label>Usuário SQL</Label>
        <Input
          placeholder="ex.: ops"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label>Senha</Label>
        <Input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label>Banco de dados</Label>
        <Input
          placeholder="ex.: sgq"
          value={database}
          onChange={(e) => setDatabase(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Analisando banco..." : "Analisar ERP ULTRA"}
      </Button>
      <Button type="button" onClick={generateMd} disabled={!user || !database} className="w-full" variant="outline">
        Gerar conexão (.md)
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Os dados são usados apenas para esta sessão de análise, via conexão
        direta SQL Server (recomendado usuário somente leitura).
      </p>
    </form>
  );
}
