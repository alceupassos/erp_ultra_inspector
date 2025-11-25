# 📊 RELATÓRIO COMPLETO - ERP ULTRA INSPECTOR
## Documento para Cursor 2.0 - Prompt Único Completo

---

## 🎯 VISÃO GERAL DO PROJETO

### Nome do Projeto
**ERP ULTRA Inspector** - Sistema de Análise e Inspeção de Bancos de Dados SQL Server

### Objetivo Principal
Sistema web completo para análise profunda de bancos de dados SQL Server, incluindo:
- Análise estrutural completa (tabelas, views, procedures, functions)
- Análise de segurança (dados sensíveis, permissões, auditoria)
- Análise de performance (índices, queries, recursos)
- Análise de qualidade de dados (padrões, problemas, regras de negócio)
- Geração de relatórios executivos e técnicos
- Exportação de schemas, configurações e preparação para Power BI
- Integração com IA para insights automáticos

### Tecnologias Utilizadas
- **Framework**: Next.js 14.2.4 (App Router)
- **Frontend**: React 18, TypeScript
- **Estilização**: Tailwind CSS com tema dark/orange personalizado
- **Gráficos**: Recharts
- **UI Components**: shadcn/ui (Radix UI)
- **Backend**: Next.js API Routes
- **Banco de Dados**: SQL Server (mssql package)
- **Autenticação**: NextAuth.js
- **IA**: OpenAI API (opcional, para Oráculo IA)

---

## 📁 ESTRUTURA DO PROJETO

### Diretórios Principais

```
erp_ultra_inspector/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── analyze/              # Análise completa do banco
│   │   ├── auth/                 # Autenticação NextAuth
│   │   ├── creds/                # Gerenciamento de credenciais
│   │   ├── export/              # Exportações
│   │   │   ├── complete/        # Exportação completa
│   │   │   ├── config/          # Exportação de configurações
│   │   │   ├── powerbi/         # Preparação Power BI
│   │   │   └── sql-scripts/     # Geração de scripts SQL
│   │   ├── export-schema/       # Exportação de schema
│   │   ├── oracle/               # Oráculo IA
│   │   ├── reports/             # 13 Relatórios
│   │   │   ├── structure-overview/
│   │   │   ├── relationships/
│   │   │   ├── schemas-analysis/
│   │   │   ├── sensitive-data/
│   │   │   ├── user-permissions/
│   │   │   ├── security-config/
│   │   │   ├── index-analysis/
│   │   │   ├── query-performance/
│   │   │   ├── resource-usage/
│   │   │   ├── data-quality/
│   │   │   ├── data-patterns/
│   │   │   ├── executive-dashboard/
│   │   │   └── full-analysis/
│   │   ├── schemas-tables/       # Lista schemas e tabelas
│   │   ├── sgq/                  # Consultas SGQ
│   │   └── health/               # Health check
│   ├── auth/                     # Páginas de autenticação
│   ├── cepalab/                  # Página CEPALAB
│   ├── landing/                  # Landing page
│   ├── testar-login/             # Teste de login
│   ├── ultra-conexao/            # Conexão ULTRA
│   ├── page.tsx                  # Página principal
│   ├── layout.tsx                # Layout raiz
│   └── globals.css               # Estilos globais
├── components/                    # Componentes React
│   ├── layout/                   # Componentes de layout
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── ui/                       # Componentes UI (shadcn)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   └── badge.tsx
│   ├── charts/                   # Componentes de gráficos
│   ├── AnalysisSummary.tsx       # Resumo da análise
│   ├── SecurityDashboard.tsx      # Dashboard de segurança
│   ├── PerformanceDashboard.tsx   # Dashboard de performance
│   ├── ConnectionForm.tsx        # Formulário de conexão
│   ├── OraclePanel.tsx           # Painel de IA
│   ├── SchemasTablesView.tsx     # Visualização schemas/tabelas
│   └── ReportsList.tsx           # Lista de relatórios
├── lib/                          # Bibliotecas e utilitários
│   ├── sqlInspector.ts           # Inspeção SQL Server
│   ├── securityInspector.ts      # Inspeção de segurança
│   ├── performanceInspector.ts   # Inspeção de performance
│   ├── dataDiscovery.ts          # Descoberta de dados
│   ├── metrics.ts                # Cálculo de métricas
│   ├── ai.ts                     # Integração OpenAI
│   └── types.ts                  # Tipos TypeScript
├── docs/                         # Documentação
├── scripts/                      # Scripts de deploy
├── nginx/                        # Configuração Nginx
└── PLANO_INTEGRACAO_CEPALAB_ERP_ULTRA.md
```

---

## 🔧 FUNCIONALIDADES PRINCIPAIS

### 1. Análise Completa do Banco de Dados

#### Endpoint: `POST /api/analyze`

**Descrição**: Realiza análise completa e profunda do banco SQL Server.

**Parâmetros**:
```json
{
  "server": "104.234.224.238",
  "port": 1445,
  "user": "angrax",
  "password": "senha",
  "database": "sgc",
  "useTls": true
}
```

**Retorna**:
- `analysis`: Estrutura completa (tabelas, colunas, PKs, FKs, índices)
- `vulns`: Métricas de vulnerabilidade
- `kpis`: KPIs estruturais
- `securityMetrics`: Métricas de segurança
- `sensitiveData`: Dados sensíveis detectados
- `userPermissions`: Permissões de usuários
- `auditConfig`: Configurações de auditoria
- `performanceMetrics`: Métricas de performance
- `indexAnalysis`: Análise de índices
- `queryPerformance`: Performance de queries
- `recommendations`: Recomendações de otimização
- `aiSummary`: Resumo gerado por IA (opcional)
- `connectionSecurity`: Modo de conexão (tls/insecure)

**Funcionalidades**:
- ✅ Conexão TLS inteligente (múltiplas tentativas)
- ✅ Análise estrutural completa
- ✅ Detecção de vulnerabilidades
- ✅ Análise de segurança (LGPD)
- ✅ Análise de performance
- ✅ Geração de resumo por IA

---

### 2. Exportações

#### 2.1 Exportação de Schema Completo
**Endpoint**: `POST /api/export-schema`

Exporta estrutura completa do banco:
- Schemas, tabelas, colunas
- Primary Keys e Foreign Keys
- Índices completos
- Views, Procedures, Functions

**Formato**: JSON estruturado

#### 2.2 Exportação de Configurações
**Endpoint**: `POST /api/export/config`

Exporta configurações do SQL Server:
- Configurações do servidor
- Configurações do banco
- Configurações de segurança
- SQL Server Agent Jobs

#### 2.3 Preparação para Power BI
**Endpoint**: `POST /api/export/powerbi`

Prepara dados para Power BI:
- Identificação de tabelas fact/dimension
- Mapeamento de relacionamentos
- Connection string para Power BI
- Recomendações de otimização

#### 2.4 Geração de Scripts SQL
**Endpoint**: `POST /api/export/sql-scripts`

Gera scripts SQL:
- Criação de tabelas
- Criação de views
- Procedures e functions
- Índices e constraints

#### 2.5 Exportação Completa
**Endpoint**: `POST /api/export/complete`

Combina todas as exportações acima em um único arquivo JSON.

---

### 3. Relatórios (13 Relatórios Disponíveis)

#### 3.1 Visão Geral do Banco
**Endpoint**: `GET /api/reports/structure-overview`

**Conteúdo**:
- Total de tabelas, views, procedures, functions
- Distribuição por schema
- Tabelas maiores (por linhas)
- Tabelas mais referenciadas (por FKs)

**Formato**: JSON + PDF exportável

#### 3.2 Análise de Relacionamentos
**Endpoint**: `GET /api/reports/relationships`

**Conteúdo**:
- Grafo de relacionamentos (FKs)
- Tabelas isoladas (sem FKs)
- Cadeias de dependências
- Identificação de tabelas fact/dimension

**Formato**: JSON + Visualização gráfica

#### 3.3 Análise de Schemas
**Endpoint**: `GET /api/reports/schemas-analysis`

**Conteúdo**:
- Tabelas por schema
- Views por schema
- Procedures e functions por schema
- Estatísticas de uso

**Formato**: JSON + CSV exportável

#### 3.4 Dados Sensíveis (LGPD)
**Endpoint**: `GET /api/reports/sensitive-data`

**Conteúdo**:
- Colunas com CPF, CNPJ, email, telefone
- Colunas com senhas, tokens, API keys
- Dados de saúde e médicos
- Score de risco por tabela

**Formato**: JSON + Excel exportável

#### 3.5 Permissões de Usuários
**Endpoint**: `GET /api/reports/user-permissions`

**Conteúdo**:
- Usuários e seus roles
- Permissões por objeto
- Usuários de alto risco
- Permissões excessivas

**Formato**: JSON + PDF exportável

#### 3.6 Configurações de Segurança
**Endpoint**: `GET /api/reports/security-config`

**Conteúdo**:
- Configurações de auditoria
- Criptografia (TDE)
- Configurações de login
- Recomendações de segurança

**Formato**: JSON + Markdown exportável

#### 3.7 Análise de Índices
**Endpoint**: `GET /api/reports/index-analysis`

**Conteúdo**:
- Índices não utilizados
- Índices faltando (sugestões)
- Índices fragmentados
- Scripts SQL para otimização

**Formato**: JSON + SQL scripts exportáveis

#### 3.8 Performance de Queries
**Endpoint**: `GET /api/reports/query-performance`

**Conteúdo**:
- Top 10 queries mais lentas
- Queries com maior I/O
- Queries com maior CPU
- Recomendações de otimização

**Formato**: JSON + CSV exportável

#### 3.9 Uso de Recursos
**Endpoint**: `GET /api/reports/resource-usage`

**Conteúdo**:
- Uso de memória
- Uso de CPU
- I/O por tabela
- Recomendações de tuning

**Formato**: JSON + Gráficos interativos

#### 3.10 Qualidade de Dados
**Endpoint**: `GET /api/reports/data-quality`

**Conteúdo**:
- Padrões de dados detectados
- Problemas de qualidade (nulos, duplicados)
- Regras de negócio violadas
- Score de qualidade por tabela

**Formato**: JSON + Excel exportável

#### 3.11 Análise de Padrões
**Endpoint**: `GET /api/reports/data-patterns`

**Conteúdo**:
- Padrões de distribuição
- Valores mais frequentes
- Outliers e anomalias
- Tendências temporais

**Formato**: JSON + Gráficos interativos

#### 3.12 Dashboard Executivo
**Endpoint**: `GET /api/reports/executive-dashboard`

**Conteúdo**:
- KPIs principais
- Resumo de segurança
- Resumo de performance
- Recomendações prioritárias

**Formato**: JSON + PDF

#### 3.13 Relatório Completo de Análise
**Endpoint**: `GET /api/reports/full-analysis`

**Conteúdo**: Todos os relatórios acima consolidados

**Formato**: JSON completo + PDF

**Parâmetros para todos os relatórios**:
```
?server=104.234.224.238&port=1445&user=angrax&password=SENHA&database=sgc
```

---

### 4. Consultas e Exploração

#### 4.1 Listagem de Schemas e Tabelas
**Endpoint**: `POST /api/schemas-tables`

**Retorna**: Lista completa de schemas, tabelas (com contagem de linhas) e views

#### 4.2 Consulta SQL Genérica
**Endpoint**: `POST /api/sgq/query`

**Funcionalidade**: Executa queries SQL customizadas

**Parâmetros**:
```json
{
  "server": "...",
  "port": 1445,
  "user": "...",
  "password": "...",
  "database": "...",
  "sql": "SELECT * FROM tabela"
}
```

#### 4.3 Listagem de Objetos
**Endpoint**: `GET /api/sgq/list`

**Retorna**: Lista de tabelas e views do banco SGQ

---

### 5. Oráculo IA

**Endpoint**: `POST /api/oracle/ask`

**Descrição**: Análise inteligente de dados usando OpenAI

**Funcionalidades**:
- Insights automáticos
- Narrativa executiva
- Ações recomendadas
- Análise de KPIs

**Parâmetros**:
```json
{
  "area": "vendas",
  "filters": {},
  "kpis": {},
  "sampleRows": [],
  "metadata": {},
  "mode": "insights",
  "question": "Qual a tendência?"
}
```

**Requisitos**:
- `OPENAI_API_KEY` configurada
- `ORACLE_ENABLED=true` (opcional)

---

## 🎨 INTERFACE DO USUÁRIO

### Tema Visual
- **Background**: Dark (preto/azul escuro)
- **Acentos**: Laranja com efeito glow
- **Componentes**: shadcn/ui customizados
- **Gráficos**: Recharts com tema dark

### Páginas Principais

#### 1. Página Principal (`/`)
- Formulário de conexão
- Abas de navegação:
  - **Overview**: Resumo geral com gráficos
  - **Security**: Dashboard de segurança
  - **Performance**: Dashboard de performance
  - **Schemas & Tabelas**: Lista completa com busca
- Log de sessão
- Configurações em uso
- Sugestões de resolução

#### 2. Componentes Principais

**ConnectionForm.tsx**:
- Formulário de conexão SQL Server
- Campos: servidor, porta, usuário, senha, banco
- Toggle TLS/SSL
- Botões de ação:
  - Analisar Banco
  - Exportar Schema
  - Exportar Config
  - Exportar Power BI
  - Exportar SQL Scripts
  - Executar Plano Completo de Exportação

**AnalysisSummary.tsx**:
- Resumo da análise
- Gráficos de métricas
- Mapa de tabelas
- Análise descritiva (IA)

**SecurityDashboard.tsx**:
- Métricas de segurança
- Dados sensíveis
- Permissões de usuários
- Configurações de auditoria

**PerformanceDashboard.tsx**:
- Métricas de performance
- Análise de índices
- Performance de queries
- Recomendações

**SchemasTablesView.tsx**:
- Lista de schemas expansível
- Busca por schema/tabela/view
- Contagem de linhas por tabela
- Visualização organizada

**ReportsList.tsx**:
- Lista de 13 relatórios
- Filtros por categoria
- Botões de visualização e download

---

## 🔐 SEGURANÇA E AUTENTICAÇÃO

### NextAuth.js
- Autenticação via providers
- Sessões seguras
- Middleware de proteção

### Gerenciamento de Credenciais
- **GET /api/creds**: Obter credenciais
- **POST /api/creds/update**: Atualizar credenciais

### TLS/SSL Inteligente
- Múltiplas tentativas automáticas:
  1. TLS estrito (encrypt: true, trustServerCertificate: false)
  2. TLS com trust (encrypt: true, trustServerCertificate: true)
  3. Sem TLS (encrypt: false) - fallback
- Cache de configurações TLS

---

## 📊 ANÁLISES IMPLEMENTADAS

### 1. Análise Estrutural (`lib/sqlInspector.ts`)

**Função**: `inspectSqlServer()`

**Analisa**:
- Tabelas e views
- Colunas e tipos de dados
- Primary Keys
- Foreign Keys
- Índices
- Contagem de linhas
- Finalidade heurística das tabelas

### 2. Análise de Segurança (`lib/securityInspector.ts`)

**Função**: `inspectSecurity()`

**Analisa**:
- Dados sensíveis (CPF, CNPJ, email, telefone, senhas, tokens)
- Permissões de usuários
- Configurações de auditoria
- Criptografia (TDE)
- Score de segurança geral

**Tipos de dados sensíveis detectados**:
- CPF, CNPJ, RG
- Email, telefone
- Endereço
- Cartão de crédito, conta bancária
- Salário
- Dados de saúde/médicos
- Senhas, tokens, API keys

### 3. Análise de Performance (`lib/performanceInspector.ts`)

**Função**: `inspectPerformance()`

**Analisa**:
- Eficiência de índices
- Performance de queries
- Fragmentação de índices
- Uso de memória
- Queries lentas
- Índices faltando
- Índices não utilizados

### 4. Análise de Qualidade de Dados (`lib/dataDiscovery.ts`)

**Função**: `discoverDataQuality()`

**Analisa**:
- Padrões de dados (EMAIL, PHONE, CPF, CNPJ, DATE, CURRENCY, etc.)
- Problemas de qualidade (duplicados, nulos, formatos inválidos, outliers)
- Regras de negócio
- Score de qualidade geral

### 5. Cálculo de Métricas (`lib/metrics.ts`)

**Funções**:
- `computeVulnerabilityMetrics()`: Calcula métricas de vulnerabilidade
- `computeStructuralKpis()`: Calcula KPIs estruturais

---

## 🗄️ CONEXÕES COM BANCO DE DADOS

### Configuração de Conexão

```typescript
interface ConnectionConfig {
  server: string;        // IP ou hostname
  port: number;         // Porta (padrão: 1433)
  database: string;     // Nome do banco
  user: string;         // Usuário
  password: string;     // Senha
  useTls?: boolean;     // Usar TLS/SSL
  connectionTimeout?: number;  // Timeout de conexão (ms)
  requestTimeout?: number;     // Timeout de request (ms)
  pool?: {
    max?: number;       // Máximo de conexões
    min?: number;       // Mínimo de conexões
    idleTimeoutMillis?: number; // Timeout de idle
  };
}
```

### Bancos de Dados Suportados

#### Banco 1: SGC (Sistema de Gestão Comercial)
- **Servidor**: 104.234.224.238
- **Porta**: 1445
- **Database**: sgc
- **Usuário**: angrax

#### Banco 2: SGQ (Sistema de Gestão de Qualidade)
- **Servidor**: 104.234.224.238
- **Porta**: 1445
- **Database**: sgq
- **Usuário**: ops
- **Senha**: Suporte2022=Mais

### Pool de Conexões

**Configuração Padrão**:
```typescript
pool: {
  max: 5,                    // Máximo 5 conexões simultâneas
  min: 0,                    // Mínimo 0 (cria sob demanda)
  idleTimeoutMillis: 30000   // Fecha conexões idle após 30s
}
```

**Gerenciamento**:
- Conexões são fechadas automaticamente após uso
- Pool é reutilizado entre requests
- Timeout de 15s para conexão e request

---

## 📦 DEPENDÊNCIAS PRINCIPAIS

```json
{
  "next": "^14.2.4",
  "react": "^18",
  "typescript": "^5",
  "mssql": "^10.0.0",
  "next-auth": "^4.24.0",
  "recharts": "^2.10.0",
  "@radix-ui/react-*": "latest",
  "tailwindcss": "^3.4.0",
  "lucide-react": "latest"
}
```

**Dependências Opcionais**:
- `openai`: Para Oráculo IA
- `pdf-lib`: Para exportação PDF (futuro)
- `xlsx`: Para exportação Excel (futuro)

---

## 🚀 COMO USAR

### 1. Instalação

```bash
npm install
```

### 2. Configuração

Criar `.env.local`:
```bash
# SQL Server Principal
MSSQL_SERVER=104.234.224.238
MSSQL_PORT=1445
MSSQL_DATABASE=sgc
MSSQL_USER=angrax
MSSQL_PASSWORD=sua-senha

# SQL Server SGQ
MSSQL_SGQ_SERVER=104.234.224.238
MSSQL_SGQ_PORT=1445
MSSQL_SGQ_DATABASE=sgq
MSSQL_SGQ_USER=ops
MSSQL_SGQ_PASSWORD=Suporte2022=Mais

# OpenAI (opcional)
OPENAI_API_KEY=sk-...
ORACLE_ENABLED=true
ORACLE_MODEL=gpt-4o-mini
ORACLE_TIMEOUT=20000
```

### 3. Executar

```bash
npm run dev
```

Acessar: `http://localhost:3000/`

### 4. Build para Produção

```bash
npm run build
npm start
```

---

## 📝 EXEMPLOS DE USO

### Exemplo 1: Análise Completa

```typescript
// Frontend
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    server: '104.234.224.238',
    port: 1445,
    user: 'angrax',
    password: 'senha',
    database: 'sgc',
    useTls: true
  })
});

const data = await response.json();
// data.analysis, data.vulns, data.kpis, etc.
```

### Exemplo 2: Gerar Relatório

```typescript
// Frontend ou API
const response = await fetch(
  '/api/reports/structure-overview?server=104.234.224.238&port=1445&user=angrax&password=senha&database=sgc'
);

const report = await response.json();
// report.summary, report.largestTables, etc.
```

### Exemplo 3: Exportar Schema

```typescript
const response = await fetch('/api/export-schema', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    server: '104.234.224.238',
    port: 1445,
    user: 'angrax',
    password: 'senha',
    database: 'sgc'
  })
});

const schema = await response.json();
// schema.schemas, schema.tables, schema.views, etc.
```

---

## 🔄 FLUXO DE FUNCIONAMENTO

### 1. Conexão e Análise

```
Usuário preenche formulário
    ↓
ConnectionForm.tsx envia POST /api/analyze
    ↓
API cria pool de conexão (TLS inteligente)
    ↓
Executa múltiplas análises em paralelo:
  - inspectSqlServer() → Estrutura
  - inspectSecurity() → Segurança
  - inspectPerformance() → Performance
  - describeSchemaWithAI() → Resumo IA (opcional)
    ↓
Retorna dados consolidados
    ↓
Frontend atualiza state e exibe nas abas
    ↓
Carrega automaticamente schemas/tabelas
```

### 2. Geração de Relatórios

```
Usuário acessa /api/reports/{nome}
    ↓
API recebe parâmetros de conexão
    ↓
Cria pool de conexão
    ↓
Executa queries específicas do relatório
    ↓
Processa e estrutura dados
    ↓
Retorna JSON com relatório completo
```

### 3. Exportações

```
Usuário clica em botão de exportação
    ↓
Frontend chama endpoint específico
    ↓
API executa queries de exportação
    ↓
Estrutura dados em formato específico
    ↓
Retorna JSON ou arquivo para download
```

---

## 🎯 CASOS DE USO

### Caso 1: Auditoria de Segurança (LGPD)
1. Executar análise completa
2. Verificar aba Security
3. Gerar relatório `/api/reports/sensitive-data`
4. Identificar dados sensíveis
5. Implementar proteções necessárias

### Caso 2: Otimização de Performance
1. Executar análise completa
2. Verificar aba Performance
3. Gerar relatório `/api/reports/index-analysis`
4. Gerar relatório `/api/reports/query-performance`
5. Aplicar scripts SQL de otimização

### Caso 3: Documentação do Banco
1. Executar `/api/export/complete`
2. Obter schema completo
3. Gerar scripts SQL
4. Preparar para Power BI

### Caso 4: Análise Executiva
1. Gerar `/api/reports/executive-dashboard`
2. Obter visão geral
3. Identificar prioridades
4. Gerar `/api/reports/full-analysis` para documentação completa

---

## 🐛 TRATAMENTO DE ERROS

### Erros Comuns e Soluções

1. **Erro de Conexão**:
   - Verificar servidor, porta, usuário, senha
   - Verificar firewall
   - Tentar com/sem TLS

2. **Timeout**:
   - Aumentar `connectionTimeout` e `requestTimeout`
   - Verificar rede

3. **Permissões Insuficientes**:
   - Verificar permissões do usuário no SQL Server
   - Necessário acesso a `sys.*` views

4. **Erro de Compilação**:
   - Verificar tipos TypeScript
   - Executar `npm run build` para ver erros

---

## 📚 DOCUMENTAÇÃO ADICIONAL

### Arquivos de Documentação

- `PLANO_INTEGRACAO_CEPALAB_ERP_ULTRA.md`: Plano completo de integração
- `PLANO_EXPORTACAO_SQL_ULTRA.md`: Plano de exportação
- `CREDITOS_CLAUDE.md`: Diagnóstico de créditos
- `DEPLOY.md`: Guia de deploy
- `TROUBLESHOOTING.md`: Troubleshooting
- `FIXES.md`: Problemas e soluções

---

## 🔮 FUNCIONALIDADES FUTURAS

### Planejadas mas não implementadas:

1. **Componentes**:
   - ReportViewer.tsx
   - RelationshipGraph.tsx
   - DataQualityPanel.tsx
   - ExportManager.tsx
   - ConnectionManager.tsx

2. **Exportações**:
   - Exportação em múltiplos formatos (SQL, CSV, Markdown)
   - Exportação de configurações de backup
   - Geração de arquivo .pbix template
   - Scripts de migração

3. **Melhorias**:
   - Cache de respostas do Oráculo IA
   - Histórico de análises
   - Agendamento de exportações
   - Validação de queries perigosas
   - Filtros avançados em schemas/tabelas

---

## 💡 DICAS DE DESENVOLVIMENTO

### Adicionar Novo Relatório

1. Criar arquivo `app/api/reports/{nome}/route.ts`
2. Implementar função `GET` com parâmetros de conexão
3. Executar queries específicas
4. Estruturar dados de resposta
5. Adicionar em `ReportsList.tsx`

### Adicionar Novo Componente

1. Criar em `components/`
2. Usar tema dark/orange
3. Seguir padrão de componentes existentes
4. Usar shadcn/ui quando possível

### Modificar Análise

1. Editar arquivo correspondente em `lib/`
2. Manter tipos em `lib/types.ts`
3. Atualizar endpoint em `app/api/analyze/route.ts`
4. Atualizar componentes de exibição

---

## 🎓 CONCEITOS IMPORTANTES

### TLS/SSL Inteligente
O sistema tenta múltiplas configurações TLS automaticamente até uma funcionar, garantindo compatibilidade com diferentes configurações de SQL Server.

### Pool de Conexões
Conexões são reutilizadas entre requests para melhor performance. Pool é gerenciado automaticamente.

### Análise Heurística
O sistema usa heurísticas para identificar finalidades de tabelas baseado em nomes, colunas e relacionamentos.

### Score de Segurança
Calculado baseado em:
- Dados sensíveis detectados
- Permissões de usuários
- Configurações de segurança
- Criptografia

### Score de Performance
Calculado baseado em:
- Eficiência de índices
- Performance de queries
- Fragmentação
- Uso de recursos

---

## 📊 MÉTRICAS E KPIs

### Métricas de Vulnerabilidade
- `missingPrimaryKeyRatio`: Proporção de tabelas sem PK
- `tablesWithoutForeignKeysRatio`: Proporção sem FKs
- `nullableKeyLikeColumnsRatio`: Colunas tipo chave que são nulas
- `potentialSensitiveColumns`: Colunas potencialmente sensíveis

### KPIs Estruturais
- `avgColumnsPerTable`: Média de colunas por tabela
- `avgRowCount`: Média de linhas por tabela
- `maxRowCount`: Máximo de linhas
- `fkPerTableAvg`: Média de FKs por tabela

### Métricas de Segurança
- `sensitiveDataScore`: Score de dados sensíveis (0-100)
- `userAccessScore`: Score de acesso de usuários (0-100)
- `securityConfigurationScore`: Score de configuração (0-100)
- `encryptionScore`: Score de criptografia (0-100)
- `overallSecurityScore`: Score geral (0-100)

### Métricas de Performance
- `indexEfficiency`: Eficiência de índices (0-100)
- `queryPerformanceScore`: Score de queries (0-100)
- `fragmentationScore`: Score de fragmentação (0-100)
- `memoryUsageScore`: Score de uso de memória (0-100)
- `overallPerformanceScore`: Score geral (0-100)

---

## 🔍 QUERIES SQL PRINCIPAIS

### Listar Tabelas
```sql
SELECT 
  s.name AS schema_name,
  t.name AS table_name
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
ORDER BY s.name, t.name;
```

### Listar Views
```sql
SELECT 
  s.name AS schema_name,
  v.name AS view_name
FROM sys.views v
JOIN sys.schemas s ON v.schema_id = s.schema_id
ORDER BY s.name, v.name;
```

### Primary Keys
```sql
SELECT 
  kc.parent_object_id AS object_id,
  col.name AS column_name
FROM sys.key_constraints kc
JOIN sys.index_columns ic 
  ON kc.parent_object_id = ic.object_id 
  AND kc.unique_index_id = ic.index_id
JOIN sys.columns col
  ON col.object_id = ic.object_id 
  AND col.column_id = ic.column_id
WHERE kc.type = 'PK';
```

### Foreign Keys
```sql
SELECT 
  fk.name AS fk_name,
  OBJECT_SCHEMA_NAME(fk.parent_object_id) + '.' + OBJECT_NAME(fk.parent_object_id) AS parent_table,
  OBJECT_SCHEMA_NAME(fk.referenced_object_id) + '.' + OBJECT_NAME(fk.referenced_object_id) AS referenced_table
FROM sys.foreign_keys fk;
```

---

## 🎨 ESTILOS E TEMA

### Classes CSS Customizadas

- `glow-orange`: Texto laranja com glow
- `glow-orange-soft`: Glow suave
- `glow-orange-subtle`: Glow sutil
- `glow-border`: Borda com glow
- `neu-card`: Card com efeito neumórfico
- `neu-hover`: Hover com efeito neumórfico
- `animated-pulse-glow`: Animação de pulso

### Cores do Tema

```css
background: #0a0a0a (preto)
foreground: #ffffff (branco)
primary: #ff8a1f (laranja)
muted: #666666 (cinza)
card: #1a1a1a (preto claro)
```

---

## 🚢 DEPLOY

### Scripts Disponíveis

- `deploy.sh`: Deploy completo para VPS
- `deploy-remote.sh`: Deploy remoto via SSH
- `deploy-quick.sh`: Deploy rápido
- `scripts/setup-nginx.sh`: Configuração Nginx
- `scripts/setup-ssl.sh`: Configuração SSL/Let's Encrypt

### Configuração de Produção

- Next.js standalone build
- PM2 para gerenciamento de processos
- Nginx como reverse proxy
- SSL/Let's Encrypt automático

---

## 📈 ESTATÍSTICAS DO PROJETO

- **Arquivos TypeScript**: 50+
- **Componentes React**: 15+
- **API Routes**: 25+
- **Bibliotecas**: 10+
- **Linhas de código**: 10.000+
- **Relatórios**: 13
- **Análises**: 4 tipos principais

---

## 🎯 OBJETIVO FINAL

Criar um sistema completo e profissional para análise de bancos SQL Server que:
- ✅ Forneça insights profundos sobre estrutura, segurança e performance
- ✅ Gere relatórios executivos e técnicos
- ✅ Facilite exportações e documentação
- ✅ Seja fácil de usar e integrar
- ✅ Seja extensível e manutenível

---

**Versão do Documento**: 1.0
**Data**: $(date)
**Status**: ✅ Completo e Atualizado
**Uso**: Prompt único para Cursor 2.0

---

## 📞 INFORMAÇÕES DE CONTATO E SUPORTE

Para dúvidas ou problemas:
1. Consultar `TROUBLESHOOTING.md`
2. Consultar `FIXES.md`
3. Verificar logs do servidor
4. Verificar console do navegador

---

**FIM DO RELATÓRIO**

