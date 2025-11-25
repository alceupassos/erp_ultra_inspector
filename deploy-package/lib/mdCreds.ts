import fs from "fs";
import path from "path";

export type MdCreds = { server: string; port: number; database: string; user: string; password?: string };

export function readMdCreds(): MdCreds | null {
  const candidates = [
    path.join(process.cwd(), "docs", "conexao-sql-sgc-md.md"),
    path.join(process.cwd(), "docs", "conexão-sql-sgc-md.md"),
    path.join(process.cwd(), "docs", "conexao-sql-sgc.md"),
    path.join(process.cwd(), "docs", "Conexao_SQL_Server_Gerador.md"),
  ];
  for (const file of candidates) {
    try {
      if (!fs.existsSync(file)) continue;
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split(/\r?\n/);
      const get = (key: string) => {
        const re = new RegExp(`${key}\s*[:=]\s*(.+)`, "i");
        const m = lines.find((l) => re.test(l));
        return m ? (m.match(re)![1].trim()) : undefined;
      };
      const server = get("Servidor") || get("MSSQL_SERVER");
      const portStr = get("Porta") || get("MSSQL_PORT");
      const database = get("Database") || get("MSSQL_DATABASE");
      const user = get("Usuário") || get("MSSQL_USER");
      const password = get("Senha") || get("MSSQL_PASSWORD");
      if (server && portStr && database && user) {
        return { server, port: Number(portStr), database, user, password };
      }
    } catch {}
  }
  return null;
}