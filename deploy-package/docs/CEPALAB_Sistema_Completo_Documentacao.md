# 🏥 CEPALAB - Sistema Completo de Gestão Laboratorial
## Documentação Técnica para Cursor 2.0

### 📋 Visão Geral do Sistema

O **CEPALAB** é um sistema ERP/SGC (Sistema de Gestão Comercial) especializado em gestão laboratorial e distribuição de produtos médicos, farmacêuticos e hospitalares. O sistema opera com SQL Server e possui uma arquitetura robusta para controle de vendas, estoque, financeiro e operações logísticas.

### 🗄️ Estrutura do Banco de Dados

#### **Views Principais Analisadas:**

##### 1. **v_venda** - View de Vendas
```sql
-- Estrutura da view v_venda
id_nota_pedido_expedicao: int
codigo_venda: int  
data: datetime
codigo_cliente: int
nome_cliente: varchar
condpg_codigo: int
valor_total: decimal
valor_servico: decimal
codigo_vendedor: int
nome_vendedor: varchar
```

**Dados de Exemplo:**
- Hospital de Guarnição de Florianópolis - R$ 8.358,00
- Consórcio de Desenvolvimento Intermunicipal - R$ 122.512,00
- Fundo Municipal de Saúde de Guaraciaba/SC - R$ 19.995,00

##### 2. **v_estoque** - View de Estoque
```sql
-- Estrutura da view v_estoque
empr_codigo: int
prod_codigo: varchar
qtd_fisica: int
qtd_reservada: int
qtd_disponivel: int
qtd_recepcao: int
```

**Análise de Estoque:**
- Produto 000002: 373 unidades físicas, 65 reservadas, 308 disponíveis
- Produto 000003: 177 unidades físicas, 227 reservadas, -50 disponíveis (falta)
- Produto 000005: 3.998 unidades físicas, 0 reservadas, 3.998 disponíveis

##### 3. **v_situacao_caixa** - View de Situação do Caixa
```sql
-- Estrutura da view v_situacao_caixa
codigo: int
nome: varchar
situacao: varchar
data_abertura: datetime
saldo_inicial_total: decimal
saldo_atual_total: decimal
```

**Situação dos Caixas:**
- **TESOURARIA**: Aberto desde 04/05/2022, saldo atual R$ 118.099,85
- **CAIXA GERAL**: Aberto desde 25/02/2025, saldo atual -R$ 786.122,88 (negativo)

##### 4. **v_conta_receber** - View de Contas a Receber
```sql
-- Estrutura da view v_conta_receber
NF_Pedido_NFS: varchar
codigo: int
valor: decimal
cod_cliente: int
clif_nome: varchar
data_vencimento: datetime
cobr_nome: varchar
Sit_nome: varchar
```

**Exemplos de Contas:**
- Flash Prestação de Serviços Eireli - R$ 31.500,00 - Vencimento 04/08/2021
- Nação Esportes Futebol Clube - R$ 1.320,00 - Vencimento 20/07/2021

### 🎯 Módulos do Sistema

#### **1. Módulo de Vendas**
**Objetos Envolvidos:**
- `v_venda`, `v_venda_item`, `v_venda_item_lucratividade`
- `v_venda_item_servico`

**Funcionalidades:**
- Gestão de vendas por cliente e vendedor
- Análise de lucratividade por item
- Controle de serviços vendidos
- Relatórios de performance de vendas

#### **2. Módulo de Estoque**
**Objetos Envolvidos:**
- `v_estoque`, `v_estoque_reservado`, `v_estoque_serial`
- `v_estoque_reservado_pedido`, `v_estoque_reservado_lote`
- `v_estoque_aguardando_recepcao`

**Funcionalidades:**
- Controle de estoque físico e disponível
- Gestão de reservas por pedido
- Controle por serial/lote
- Monitoramento de recepção

#### **3. Módulo Financeiro**
**Objetos Envolvidos:**
- `v_conta_receber`, `v_situacao_caixa`
- `v_forma_pagto_vtex`

**Funcionalidades:**
- Contas a receber por cliente
- Situação de caixas (aberto/fechado)
- Formas de pagamento
- Análise de fluxo de caixa

#### **4. Módulo de Operações/Logística**
**Objetos Envolvidos:**
- `v_pedido_item_serial`, `v_disponibiliza_todos_pedidos`
- `v_disponibiliza_pedido_entrada_antes_expedicao`
- `v_disponibiliza_pedido_saida_apos_expedicao`

**Funcionalidades:**
- Controle de pedidos por serial
- Disponibilização de pedidos
- Gestão de entrada/saída de expedição

### 📊 Dashboards e Gráficos com Recharts

#### **Dashboard de Vendas**
```tsx
// Componente React com Recharts
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Gráfico de Vendas por Período
const VendasChart = () => {
  const data = [
    { mes: 'Jan', vendas: 45000, clientes: 120 },
    { mes: 'Fev', vendas: 52000, clientes: 135 },
    { mes: 'Mar', vendas: 48000, clientes: 128 }
  ];

  return (
    <LineChart data={data}>
      <Line type="monotone" dataKey="vendas" stroke="#3b82f6" />
      <Line type="monotone" dataKey="clientes" stroke="#10b981" />
    </LineChart>
  );
};
```

#### **Dashboard de Estoque**
```tsx
// Gráfico de Estoque por Produto
const EstoqueChart = () => {
  const data = [
    { produto: 'Prod A', fisico: 1000, reservado: 200, disponivel: 800 },
    { produto: 'Prod B', fisico: 500, reservado: 100, disponivel: 400 }
  ];

  return (
    <BarChart data={data}>
      <Bar dataKey="fisico" fill="#6366f1" />
      <Bar dataKey="reservado" fill="#f59e0b" />
      <Bar dataKey="disponivel" fill="#10b981" />
    </BarChart>
  );
};
```

#### **Dashboard Financeiro**
```tsx
// Gráfico de Contas a Receber por Status
const FinanceiroChart = () => {
  const data = [
    { name: 'Normal', value: 85, color: '#10b981' },
    { name: 'Atrasado', value: 10, color: '#f59e0b' },
    { name: 'Crítico', value: 5, color: '#ef4444' }
  ];

  return (
    <PieChart>
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={entry.color} />
      ))}
    </PieChart>
  );
};
```

### 🔍 Filtros Avançados

#### **Filtros de Vendas**
```tsx
interface FiltrosVenda {
  dataInicio: Date;
  dataFim: Date;
  codigoCliente?: number;
  codigoVendedor?: number;
  valorMinimo?: number;
  valorMaximo?: number;
}

const filtrosVenda = {
  periodo: '30dias',
  cliente: 'todos',
  vendedor: 'todos',
  status: 'todas'
};
```

#### **Filtros de Estoque**
```tsx
interface FiltrosEstoque {
  produto?: string;
  familia?: string;
  deposito?: number;
  situacao?: 'positivo' | 'negativo' | 'todos';
  lote?: string;
  serial?: string;
}
```

#### **Filtros Financeiros**
```tsx
interface FiltrosFinanceiro {
  dataVencimentoInicio: Date;
  dataVencimentoFim: Date;
  cliente?: number;
  status?: 'normal' | 'atrasado' | 'todos';
  valorMinimo?: number;
  valorMaximo?: number;
}
```

### 🎨 Componentes Shadcn/UI com Animações

#### **Card de Métricas Animado**
```tsx
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MetricCard = ({ title, value, icon, color }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`border-${color}-500`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
```

#### **Tabela com Paginação e Filtros**
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const TabelaVendas = ({ dados, filtros, onFiltroChange }) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Filtrar por cliente..."
          value={filtros.cliente}
          onChange={(e) => onFiltroChange('cliente', e.target.value)}
        />
        <Input
          type="date"
          value={filtros.dataInicio}
          onChange={(e) => onFiltroChange('dataInicio', e.target.value)}
        />
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Vendedor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dados.map((venda) => (
            <TableRow key={venda.codigo_venda}>
              <TableCell>{venda.nome_cliente}</TableCell>
              <TableCell>{new Date(venda.data).toLocaleDateString()}</TableCell>
              <TableCell>R$ {venda.valor_total.toFixed(2)}</TableCell>
              <TableCell>{venda.nome_vendedor}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
```

### 📱 Layout Responsivo

#### **Dashboard Grid**
```tsx
const DashboardLayout = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard title="Vendas do Mês" value="R$ 125.450,00" color="blue" />
      <MetricCard title="Clientes Ativos" value="1.234" color="green" />
      <MetricCard title="Estoque Disponível" value="15.678" color="purple" />
      <MetricCard title="Contas a Receber" value="R$ 45.230,00" color="orange" />
    </div>
  );
};
```

### 🔧 Queries SQL para Dashboards

#### **Vendas por Período**
```sql
-- Vendas mensais
SELECT 
    YEAR(data) as ano,
    MONTH(data) as mes,
    COUNT(*) as total_vendas,
    SUM(valor_total) as valor_total,
    COUNT(DISTINCT codigo_cliente) as clientes_unicos
FROM v_venda 
WHERE data >= DATEADD(MONTH, -12, GETDATE())
GROUP BY YEAR(data), MONTH(data)
ORDER BY ano DESC, mes DESC
```

#### **Top Clientes por Valor**
```sql
-- Top 10 clientes por valor
SELECT TOP 10
    codigo_cliente,
    nome_cliente,
    COUNT(*) as total_compras,
    SUM(valor_total) as valor_total
FROM v_venda
GROUP BY codigo_cliente, nome_cliente
ORDER BY valor_total DESC
```

#### **Estoque Crítico**
```sql
-- Produtos com estoque negativo
SELECT 
    prod_codigo,
    qtd_fisica,
    qtd_reservada,
    qtd_disponivel
FROM v_estoque 
WHERE qtd_disponivel < 0
ORDER BY qtd_disponivel ASC
```

#### **Contas Vencidas**
```sql
-- Contas a receber vencidas
SELECT 
    cod_cliente,
    clif_nome,
    valor,
    data_vencimento,
    DATEDIFF(DAY, data_vencimento, GETDATE()) as dias_atraso
FROM v_conta_receber 
WHERE data_vencimento < GETDATE() 
    AND Sit_nome = 'NORMAL'
ORDER BY dias_atraso DESC
```

### 🚀 Implementação no Cursor 2.0

#### **Estrutura de Pastas Sugerida:**
```
src/
├── components/
│   ├── cepalab/
│   │   ├── vendas/
│   │   │   ├── VendasDashboard.tsx
│   │   │   ├── VendasChart.tsx
│   │   │   ├── VendasTable.tsx
│   │   │   └── VendasFilters.tsx
│   │   ├── estoque/
│   │   │   ├── EstoqueDashboard.tsx
│   │   │   ├── EstoqueChart.tsx
│   │   │   ├── EstoqueTable.tsx
│   │   │   └── EstoqueFilters.tsx
│   │   ├── financeiro/
│   │   │   ├── FinanceiroDashboard.tsx
│   │   │   ├── FinanceiroChart.tsx
│   │   │   ├── ContasReceberTable.tsx
│   │   │   └── FinanceiroFilters.tsx
│   │   └── shared/
│   │       ├── MetricCard.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
├── hooks/
│   ├── useVendas.ts
│   ├── useEstoque.ts
│   └── useFinanceiro.ts
├── lib/
│   ├── cepalab-api.ts
│   └── queries.ts
└── types/
    └── cepalab.ts
```

#### **Arquivo de Tipos TypeScript:**
```tsx
// types/cepalab.ts
export interface Venda {
  id_nota_pedido_expedicao: number;
  codigo_venda: number;
  data: string;
  codigo_cliente: number;
  nome_cliente: string;
  valor_total: number;
  codigo_vendedor: number;
  nome_vendedor: string;
}

export interface Estoque {
  empr_codigo: number;
  prod_codigo: string;
  qtd_fisica: number;
  qtd_reservada: number;
  qtd_disponivel: number;
  qtd_recepcao: number;
}

export interface ContaReceber {
  codigo: number;
  cod_cliente: number;
  clif_nome: string;
  valor: number;
  data_vencimento: string;
  cobr_nome: string;
  Sit_nome: string;
}
```

### 📈 KPIs e Métricas Principais

#### **Vendas:**
- Total de vendas do mês
- Ticket médio por cliente
- Top 10 clientes por valor
- Vendas por vendedor
- Produtos mais vendidos

#### **Estoque:**
- Produtos com estoque negativo
- Produtos próximos ao vencimento
- Giro de estoque
- Produtos sem movimentação

#### **Financeiro:**
- Contas a receber vencidas
- Contas a receber por período
- Formas de pagamento mais utilizadas
- Inadimplência por cliente

### 🎨 Paleta de Cores Sugerida

```css
:root {
  --primary-blue: #3b82f6;
  --success-green: #10b981;
  --warning-orange: #f59e0b;
  --danger-red: #ef4444;
  --purple: #6366f1;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-800: #1f2937;
  --gray-900: #111827;
}
```

### 📚 Queries de Apoio para Análises

#### **Análise de Vendas por Cliente**
```sql
-- Perfil de compras por cliente
SELECT 
    codigo_cliente,
    nome_cliente,
    COUNT(*) as frequencia_compras,
    SUM(valor_total) as valor_total,
    AVG(valor_total) as ticket_medio,
    MAX(data) as ultima_compra
FROM v_venda 
WHERE data >= DATEADD(MONTH, -6, GETDATE())
GROUP BY codigo_cliente, nome_cliente
HAVING COUNT(*) > 1
ORDER BY valor_total DESC
```

#### **Análise de Estoque por Família**
```sql
-- Agrupar estoque por família de produtos (se houver tabela de produtos)
-- Esta query precisa ser adaptada conforme a estrutura real
SELECT 
    SUBSTRING(prod_codigo, 1, 3) as familia,
    COUNT(*) as total_produtos,
    SUM(qtd_fisica) as total_fisico,
    SUM(qtd_disponivel) as total_disponivel
FROM v_estoque 
GROUP BY SUBSTRING(prod_codigo, 1, 3)
ORDER BY total_disponivel DESC
```

### 🔐 Segurança e Performance

#### **Boas Práticas:**
- Usar índices nas colunas frequentemente consultadas
- Implementar paginação para grandes volumes de dados
- Cache de queries frequentes
- Limite de registros (TOP) em consultas
- Sanitização de parâmetros SQL

#### **Queries Otimizadas:**
```sql
-- Usar WITH (NOLOCK) para evitar bloqueios em tabelas de leitura
SELECT TOP 100 * FROM v_venda WITH (NOLOCK) WHERE data >= @data_inicio

-- Índices sugeridos
CREATE INDEX IX_venda_data ON venda(data)
CREATE INDEX IX_venda_cliente ON venda(codigo_cliente)
CREATE INDEX IX_estoque_produto ON estoque(prod_codigo)
```

---

### 📝 Notas de Implementação

1. **Conexão com Banco**: Usar as credenciais do arquivo `docs/conexao-sql-sgc.md`
2. **Performance**: Implementar lazy loading e paginação
3. **Filtros**: Criar componentes reutilizáveis de filtros
4. **Gráficos**: Usar Recharts com temas customizados
5. **Responsividade**: Mobile-first com Tailwind CSS
6. **TypeScript**: Manter tipagem forte em todos os componentes
7. **Error Handling**: Implementar tratamento de erros robusto
8. **Loading States**: Adicionar skeletons e spinners apropriados

### 📤 Exportação para Cursor 2.0

Este documento está formatado para ser copiado integralmente para o Cursor 2.0, onde você pode:

1. Criar os componentes React baseados nos exemplos
2. Implementar as queries SQL fornecidas
3. Configurar os dashboards com os gráficos sugeridos
4. Adicionar os filtros avançados descritos
5. Implementar as animações com Framer Motion

**Total de objetos analisados:** 200+ tabelas e views
**Módulos principais:** 4 (Vendas, Estoque, Financeiro, Operações)
**Dashboards sugeridos:** 8+
**Componentes React:** 20+

---

*Documentação gerada para sistema CEPALAB - ERP/SGC Laboratorial*  
*Data: Novembro 2025*  
*Versão: 1.0*