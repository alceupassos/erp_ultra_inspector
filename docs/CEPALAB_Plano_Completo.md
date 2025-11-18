# CEPALAB — Descritivo de Sistema e Plano de Dashboards

Este documento descreve o sistema CEPALAB (ERP/SGC) com base na inspeção automática do SQL Server realizada pelo ERP Ultra Inspector. Inclui captura de metadados de tabelas e views, análise de relacionamentos, diretrizes de otimização, e um plano de filtros e gráficos utilizando Recharts e shadcn/ui, com sugestões de animação.

## Fonte dos dados
- Origem: SQL Server remoto do CEPALAB
- Acesso: endpoints locais do ERP Ultra Inspector
- Arquivo de credenciais MD lido automaticamente

## Como capturar o schema
Usar os endpoints e consultas T‑SQL abaixo para extrair a estrutura completa.

### Tabelas e views
- Endpoint: `GET /api/sgq/list`
- Resultado: lista completa com `schema_name`, `object_name`, `object_type` (TABLE/VIEW)

### Colunas por tabela
Executar a consulta pelo endpoint `POST /api/sgq/query` com o SQL:
```sql
SELECT 
  s.name AS schema_name,
  t.name AS table_name,
  c.column_id,
  c.name AS column_name,
  ty.name AS data_type,
  c.max_length,
  c.is_nullable,
  c.is_identity
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
JOIN sys.columns c ON t.object_id = c.object_id
JOIN sys.types ty ON c.user_type_id = ty.user_type_id
ORDER BY s.name, t.name, c.column_id;
```

### Chave primária (PK)
```sql
SELECT 
  kc.parent_object_id AS object_id,
  s.name AS schema_name,
  t.name AS table_name,
  col.name AS column_name
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
JOIN sys.schemas s ON t.schema_id = s.schema_id
JOIN sys.index_columns ic 
  ON kc.parent_object_id = ic.object_id 
  AND kc.unique_index_id = ic.index_id
JOIN sys.columns col
  ON col.object_id = ic.object_id 
  AND col.column_id = ic.column_id
WHERE kc.type = 'PK'
ORDER BY s.name, t.name, col.column_id;
```

### Chaves estrangeiras (FK)
```sql
SELECT 
  fk.name AS fk_name,
  sp.name AS parent_schema,
  tp.name AS parent_table,
  sr.name AS referenced_schema,
  tr.name AS referenced_table
FROM sys.foreign_keys fk
JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
JOIN sys.schemas sp ON tp.schema_id = sp.schema_id
JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
JOIN sys.schemas sr ON tr.schema_id = sr.schema_id
ORDER BY sp.name, tp.name, fk.name;
```

### Índices
```sql
SELECT 
  s.name AS schema_name,
  t.name AS table_name,
  i.name AS index_name,
  i.type_desc AS index_type,
  i.is_unique,
  i.is_primary_key
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
JOIN sys.indexes i ON t.object_id = i.object_id
WHERE t.is_ms_shipped = 0
  AND i.type_desc IN ('CLUSTERED','NONCLUSTERED')
ORDER BY s.name, t.name, i.name;
```

### Fragmentação e uso de índices
```sql
SELECT 
  t.name AS table_name,
  i.name AS index_name,
  ips.avg_fragmentation_in_percent AS fragmentation_percent,
  ips.page_count,
  ius.user_seeks,
  ius.user_scans,
  ius.user_lookups,
  ius.user_updates,
  ius.last_user_seek,
  (ips.page_count * 8.0) / 1024.0 AS size_mb
FROM sys.tables t
INNER JOIN sys.indexes i ON t.object_id = i.object_id
INNER JOIN sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'DETAILED') ips
  ON i.object_id = ips.object_id AND i.index_id = ips.index_id
LEFT JOIN sys.dm_db_index_usage_stats ius
  ON i.object_id = ius.object_id AND i.index_id = ius.index_id AND ius.database_id = DB_ID()
WHERE t.is_ms_shipped = 0
  AND i.type_desc IN ('CLUSTERED','NONCLUSTERED')
ORDER BY ips.avg_fragmentation_in_percent DESC;
```

### Views e definições
```sql
SELECT 
  s.name AS schema_name,
  v.name AS view_name,
  m.definition AS view_definition
FROM sys.views v
JOIN sys.schemas s ON v.schema_id = s.schema_id
JOIN sys.sql_modules m ON v.object_id = m.object_id
ORDER BY s.name, v.name;
```

### Procedures e functions
```sql
SELECT 
  s.name AS schema_name,
  o.name AS object_name,
  o.type_desc AS object_type,
  m.definition
FROM sys.objects o
JOIN sys.schemas s ON o.schema_id = s.schema_id
LEFT JOIN sys.sql_modules m ON o.object_id = m.object_id
WHERE o.type IN ('P','FN','IF','TF')
ORDER BY s.name, o.name;
```

## Resultado obtido (parcial)
A lista de objetos foi capturada via `GET /api/sgq/list` e inclui centenas de entidades em `dbo`. Exemplos:
- Tabelas: `usuario`, `vendedor`, `veiculo`, `volume`, `volume_item`, `tipo_nota_fiscal`, `tipo_movimentacao`, `tipo_pedido`, `transportadora_integracao`.
- Views: `v_venda`, `v_venda_item`, `v_venda_item_lucratividade`, `v_estoque`, `v_estoque_reservado`, `v_estoque_reservado_pedido`, `v_estoque_serial`, `v_pedido_item_serial`, `v_situacao_caixa`.

Para obter a lista completa com colunas e tipos, executar as consultas deste documento via `POST /api/sgq/query` (credenciais do MD).

## Relacionamentos
- Relações chave: pedidos → itens → estoque; vendas → itens → clientes; transporte → volumes → romaneios.
- FK típicas: `pedido_item(pedido_id) → pedido(id)`, `nota_fiscal_item(nota_id) → nota_fiscal(id)`, `estoque(produto_id) → produto(id)`.
- Orfandade e consistência:
```sql
SELECT 
  fk.name AS fk_name,
  tp.name AS parent_table,
  cp.name AS parent_column,
  tr.name AS referenced_table,
  cr.name AS referenced_column
FROM sys.foreign_keys fk
JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id;
```

## Otimizações recomendadas
- Índices: revisar índices com baixa utilização ou alta fragmentação; reconstruir ou reorganizar conforme `fragmentation_percent` e `page_count`.
- Chaves: garantir PK em todas as tabelas operacionais; evitar tabelas sem FK onde há dependência lógica.
- Dados sensíveis: identificar colunas `cpf`, `cnpj`, `email`, `senha`, `token` para mascaramento e governança.
- Performance: avaliar queries mais lentas via DMV `sys.dm_exec_query_stats` e otimizar planejamentos.

## Filtros e gráficos (Recharts + shadcn/ui)
Áreas prioritárias mapeadas pelas views:
- Vendas: `v_venda`, `v_venda_item`, `v_venda_item_lucratividade`
  - Filtros: período, cliente, vendedor, produto, UF, canal
  - Gráficos: linha (receita por mês), barras empilhadas (mix de produtos), radar (performance por vendedor), tabela detalhada
- Estoque: `v_estoque`, `v_estoque_reservado`, `v_estoque_serial`, `v_estoque_reservado_pedido`
  - Filtros: produto, família, depósito, situação, lote/serial
  - Gráficos: barras (reservado vs disponível), heatmap simplificado por depósito, tabela com paginação
- Financeiro: `v_situacao_caixa`, `v_conta_receber`
  - Filtros: período, cliente, status
  - Gráficos: linha (entrada/saída), pizza (composição por categoria)
- Operação/pedidos: `v_pedido_item_serial`, `v_disponibiliza_todos_pedidos`
  - Filtros: período, status, rota, transportadora
  - Gráficos: barras (pedidos por status), tempo médio de ciclo

### Exemplo de dashboard (Next.js client)
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import { useEffect, useState } from "react";

export default function DashboardVendas() {
  const [data, setData] = useState<any[]>([]);
  const [filters, setFilters] = useState({ inicio: null as any, fim: null as any, cliente: "", vendedor: "" });

  useEffect(() => {
    const fetchData = async () => {
      const sql = `SELECT CONVERT(date, data_emissao) as dia, SUM(valor_total) as receita
                   FROM dbo.v_venda
                   WHERE (@inicio IS NULL OR data_emissao >= @inicio)
                     AND (@fim IS NULL OR data_emissao <= @fim)
                   GROUP BY CONVERT(date, data_emissao)
                   ORDER BY dia`;
      const res = await fetch("/api/sgq/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server: undefined, port: undefined, user: undefined, password: undefined, database: undefined, sql })
      });
      const j = await res.json();
      setData(j.rows || []);
    };
    fetchData();
  }, [filters]);

  return (
    <div className="space-y-4">
      <Card className="neu-card">
        <CardHeader><CardTitle>Receita diária</CardTitle></CardHeader>
        <CardContent style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="receita" stroke="#ff8a1f" strokeWidth={2} dot={false} isAnimationActive />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="neu-card">
        <CardHeader><CardTitle>Mix de produtos</CardTitle></CardHeader>
        <CardContent style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="produto" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantidade" fill="#ff8a1f" isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Interações e animação
- Recharts: `isAnimationActive`, `animationDuration`, `animationEasing`
- shadcn/ui: transições via classes utilitárias e variantes; navegação por abas; feedback visual com badges e tooltips

## Integração no Cursor 2.0
- Copiar este `.md` para o projeto
- Criar páginas de dashboard conforme seções acima
- Usar o endpoint `GET /api/sgq/list` para montar catálogos e o `POST /api/sgq/query` para dados filtrados
- Acoplar filtros padrão (período, cliente, vendedor, produto, depósito) e montar gráficos com Recharts
- Validar índices e performance com as consultas de DMV

## Referências no código
- Listagem de objetos: `app/api/sgq/list/route.ts:8`
- Execução de SQL arbitrário: `app/api/sgq/query/route.ts:6`
- Inspeção de schema (tabelas, colunas, PK/FK): `lib/sqlInspector.ts:20`
- Painel de segurança (sensíveis, permissões, auditoria): `lib/securityInspector.ts:1`
- Análise de índices e DMV: `lib/performanceInspector.ts:73`