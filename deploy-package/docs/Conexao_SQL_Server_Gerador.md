# Gerador de Conexão SQL Server

## Credenciais (preenchidas a partir da interface)
- Servidor: 104.234.224.238
- Porta: 1445
- Database: sgq
- Usuário: angrax
- Senha: [preencher]

## Variáveis de ambiente (.env.local)
```
MSSQL_SERVER=104.234.224.238
MSSQL_PORT=1445
MSSQL_DATABASE=sgq
MSSQL_USER=angrax
MSSQL_PASSWORD=
```

## Node (mssql) exemplo
```ts
import sql from 'mssql'
const config = { server: process.env.MSSQL_SERVER, port: Number(process.env.MSSQL_PORT), user: process.env.MSSQL_USER, password: process.env.MSSQL_PASSWORD, database: process.env.MSSQL_DATABASE, options: { encrypt: false, trustServerCertificate: true }, connectionTimeout: 15000, requestTimeout: 15000 }
async function main(){ const pool = await sql.connect(config); const tables = await pool.request().query("SELECT s.name AS schema_name, t.name AS table_name FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id ORDER BY s.name, t.name"); const views = await pool.request().query("SELECT s.name AS schema_name, v.name AS view_name FROM sys.views v JOIN sys.schemas s ON v.schema_id = s.schema_id ORDER BY s.name, v.name"); console.log(tables.recordset.length, views.recordset.length); pool.close(); }
main()
```

## SQL para listar
- Tabelas:
```
SELECT s.name AS schema_name, t.name AS table_name
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
ORDER BY s.name, t.name;
```
- Views:
```
SELECT s.name AS schema_name, v.name AS view_name
FROM sys.views v
JOIN sys.schemas s ON v.schema_id = s.schema_id
ORDER BY s.name, v.name;
```