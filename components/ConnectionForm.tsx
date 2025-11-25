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
  const [database, setDatabase] = useState("sgc");
  const [useTls, setUseTls] = useState(true);
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
          database,
          useTls
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
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div role="alert" className="rounded-xl border-2 border-red-500/60 bg-red-900/30 text-red-300 p-4 glow-border backdrop-blur-sm">
          <div className="font-semibold mb-2 glow-orange-soft">⚠️ Erro de Conexão</div>
          <div className="text-sm">{error}</div>
        </div>
      )}
      <div className="space-y-2">
        <Label className="text-sm font-semibold glow-orange-subtle">Servidor</Label>
        <Input 
          value="104.234.224.238" 
          disabled 
          className="bg-black/30 border-primary/20 text-primary glow-orange-subtle"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold glow-orange-subtle">Porta</Label>
        <Input 
          value="1445" 
          disabled 
          className="bg-black/30 border-primary/20 text-primary glow-orange-subtle"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold glow-orange-subtle">Usuário SQL</Label>
        <Input
          placeholder="ex.: ops"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          required
          className="bg-black/30 border-primary/30 text-primary placeholder:text-muted-foreground focus:border-primary focus:glow-border"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold glow-orange-subtle">Senha</Label>
        <Input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-black/30 border-primary/30 text-primary placeholder:text-muted-foreground focus:border-primary focus:glow-border"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold glow-orange-subtle">Banco de dados</Label>
        <Input
          type="text"
          placeholder="ex.: sgc"
          value={database}
          onChange={(e) => setDatabase(e.target.value)}
          required
          autoComplete="off"
          className="bg-black/30 border-primary/30 text-primary placeholder:text-muted-foreground focus:border-primary focus:glow-border"
        />
      </div>
      <div className="flex items-center space-x-3 p-3 rounded-xl border border-primary/20 bg-black/20 hover:border-primary/30 transition-all">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id="useTls"
            checked={useTls}
            onChange={(e) => setUseTls(e.target.checked)}
            className="peer sr-only"
          />
          <label
            htmlFor="useTls"
            className="flex items-center cursor-pointer"
          >
            <div className={`
              relative w-11 h-6 rounded-full transition-all duration-300
              ${useTls 
                ? 'bg-primary/40 border-2 border-primary' 
                : 'bg-black/40 border-2 border-primary/30'
              }
            `}>
              <div className={`
                absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-300
                ${useTls 
                  ? 'bg-primary translate-x-5 shadow-lg shadow-primary/50' 
                  : 'bg-muted-foreground/40 translate-x-0'
                }
              `} />
            </div>
            <span className="ml-3 text-sm font-semibold glow-orange-subtle">
              🔒 Usar TLS/SSL (Conexão Segura)
            </span>
          </label>
        </div>
      </div>
      <Button 
        type="submit" 
        disabled={loading} 
        className="w-full bg-primary/20 text-primary glow-border hover:bg-primary/30 transition-all font-semibold glow-on-hover"
      >
        {loading ? "🔍 Analisando banco..." : "🚀 Analisar ERP ULTRA"}
      </Button>
      <Button 
        type="button" 
        onClick={generateMd} 
        disabled={!user || !database} 
        className="w-full bg-transparent border-primary/30 text-primary hover:bg-primary/10 transition-all glow-border" 
        variant="outline"
      >
        📄 Gerar conexão (.md)
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button 
          type="button" 
          onClick={async () => {
            if (!user || !password || !database) return;
            setLoading(true);
            try {
              const res = await fetch("/api/export-schema", {
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
              if (!res.ok) {
                const json = await res.json();
                setError(json?.error || "Erro ao exportar schema");
                return;
              }
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `schema-export-${database}-${Date.now()}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              onLog?.("Schema exportado com sucesso", "success");
            } catch (e: any) {
              setError(e?.message || "Erro ao exportar schema");
              onLog?.(e?.message || "Erro ao exportar schema", "error");
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading || !user || !password || !database} 
          className="bg-transparent border-primary/30 text-primary hover:bg-primary/10 transition-all glow-border text-xs" 
          variant="outline"
        >
          📥 Schema
        </Button>
        <Button 
          type="button" 
          onClick={async () => {
            if (!user || !password || !database) return;
            setLoading(true);
            try {
              const res = await fetch("/api/export/config", {
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
              if (!res.ok) {
                const json = await res.json();
                setError(json?.error || "Erro ao exportar configurações");
                return;
              }
              const data = await res.json();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `config-export-${database}-${Date.now()}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              onLog?.("Configurações exportadas com sucesso", "success");
            } catch (e: any) {
              setError(e?.message || "Erro ao exportar configurações");
              onLog?.(e?.message || "Erro ao exportar configurações", "error");
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading || !user || !password || !database} 
          className="bg-transparent border-primary/30 text-primary hover:bg-primary/10 transition-all glow-border text-xs" 
          variant="outline"
        >
          ⚙️ Config
        </Button>
        <Button 
          type="button" 
          onClick={async () => {
            if (!user || !password || !database) return;
            setLoading(true);
            try {
              const res = await fetch("/api/export/powerbi", {
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
              if (!res.ok) {
                const json = await res.json();
                setError(json?.error || "Erro ao exportar para Power BI");
                return;
              }
              const data = await res.json();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `powerbi-export-${database}-${Date.now()}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              onLog?.("Exportação Power BI concluída", "success");
            } catch (e: any) {
              setError(e?.message || "Erro ao exportar para Power BI");
              onLog?.(e?.message || "Erro ao exportar para Power BI", "error");
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading || !user || !password || !database} 
          className="bg-transparent border-primary/30 text-primary hover:bg-primary/10 transition-all glow-border text-xs" 
          variant="outline"
        >
          📊 Power BI
        </Button>
        <Button 
          type="button" 
          onClick={async () => {
            if (!user || !password || !database) return;
            setLoading(true);
            try {
              const res = await fetch("/api/export/sql-scripts", {
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
              if (!res.ok) {
                const json = await res.json();
                setError(json?.error || "Erro ao gerar scripts SQL");
                return;
              }
              const data = await res.json();
              const scripts = data.scripts.complete;
              const blob = new Blob([scripts], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `sql-scripts-${database}-${Date.now()}.sql`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              onLog?.("Scripts SQL gerados com sucesso", "success");
            } catch (e: any) {
              setError(e?.message || "Erro ao gerar scripts SQL");
              onLog?.(e?.message || "Erro ao gerar scripts SQL", "error");
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading || !user || !password || !database} 
          className="bg-transparent border-primary/30 text-primary hover:bg-primary/10 transition-all glow-border text-xs" 
          variant="outline"
        >
          📜 SQL Scripts
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground glow-orange-subtle leading-relaxed">
        Os dados são usados apenas para esta sessão de análise, via conexão
        direta SQL Server (recomendado usuário somente leitura).
      </p>
    </form>
  );
}
