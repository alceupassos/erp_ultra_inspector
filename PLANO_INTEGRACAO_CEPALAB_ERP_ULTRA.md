# 📋 Plano Completo de Integração: ERP ULTRA Inspector → Cepalab.ia

## 🎯 Objetivo

Integrar todas as funcionalidades do ERP ULTRA Inspector no sistema Cepalab.ia, incluindo:
- Análise completa de bancos SQL Server
- Relatórios de segurança, performance e estrutura
- Exportações de schemas e configurações
- Dashboards interativos
- Conexões com múltiplos bancos de dados

---

## 📊 PARTE 1: INCREMENTOS E FUNCIONALIDADES

### 🔷 1.1 Módulo de Análise de Banco de Dados

#### **Funcionalidade Principal: Análise Completa**
- **Endpoint**: `POST /api/analyze`
- **Descrição**: Realiza análise completa do banco SQL Server
- **Retorna**:
  - Estrutura completa (tabelas, colunas, PKs, FKs, índices)
  - Métricas de vulnerabilidade
  - KPIs estruturais
  - Análise de segurança
  - Análise de performance
  - Resumo AI (opcional)

#### **Componentes Necessários**:
```typescript
// Componentes React
- AnalysisSummary.tsx (já existe)
- SecurityDashboard.tsx (já existe)
- PerformanceDashboard.tsx (já existe)
- ConnectionForm.tsx (já existe)
- SchemasTablesView.tsx (criar novo)
```

#### **Incrementos Necessários**:
1. ✅ **Análise Estrutural** - Já implementado
   - Listagem de tabelas e views
   - Análise de colunas e tipos
   - Identificação de PKs e FKs
   - Contagem de linhas

2. ✅ **Análise de Segurança** - Já implementado
   - Detecção de dados sensíveis (CPF, CNPJ, email, etc.)
   - Análise de permissões de usuários
   - Configurações de auditoria
   - Score de segurança geral

3. ✅ **Análise de Performance** - Já implementado
   - Eficiência de índices
   - Performance de queries
   - Fragmentação de índices
   - Uso de memória
   - Recomendações de otimização

4. 🔄 **Análise de Qualidade de Dados** - Parcialmente implementado
   - Padrões de dados
   - Problemas de qualidade
   - Regras de negócio
   - **INCREMENTO**: Adicionar mais regras de validação

5. 🔄 **Análise de Relacionamentos** - Parcialmente implementado
   - Mapeamento de FKs
   - Identificação de tabelas fact/dimension
   - **INCREMENTO**: Visualização gráfica de relacionamentos

---

### 🔷 1.2 Módulo de Exportação

#### **Funcionalidades de Exportação**:

1. ✅ **Exportação de Schema Completo**
   - **Endpoint**: `POST /api/export-schema`
   - **Formato**: JSON estruturado
   - **Conteúdo**:
     - Schemas, tabelas, colunas
     - Primary Keys e Foreign Keys
     - Índices completos
     - Views, Procedures, Functions
   - **INCREMENTO**: Adicionar exportação em SQL, CSV, Markdown

2. ✅ **Exportação de Configurações**
   - **Endpoint**: `POST /api/export/config`
   - **Conteúdo**:
     - Configurações do servidor SQL Server
     - Configurações do banco de dados
     - Configurações de segurança
     - SQL Server Agent Jobs
   - **INCREMENTO**: Adicionar exportação de configurações de backup

3. ✅ **Preparação para Power BI**
   - **Endpoint**: `POST /api/export/powerbi`
   - **Conteúdo**:
     - Identificação de tabelas fact/dimension
     - Mapeamento de relacionamentos
     - Connection string para Power BI
     - Recomendações de otimização
   - **INCREMENTO**: Gerar arquivo .pbix template

4. ✅ **Geração de Scripts SQL**
   - **Endpoint**: `POST /api/export/sql-scripts`
   - **Conteúdo**:
     - Scripts de criação de tabelas
     - Scripts de criação de views
     - Scripts de procedures e functions
     - Scripts de índices e constraints
   - **INCREMENTO**: Adicionar scripts de migração

5. ✅ **Exportação Completa**
   - **Endpoint**: `POST /api/export/complete`
   - **Conteúdo**: Combina todas as exportações acima
   - **INCREMENTO**: Adicionar agendamento de exportações

---

### 🔷 1.3 Módulo de Consultas e Exploração

#### **Funcionalidades**:

1. ✅ **Listagem de Schemas e Tabelas**
   - **Endpoint**: `POST /api/schemas-tables`
   - **Retorna**: Lista completa de schemas, tabelas (com contagem de linhas) e views
   - **INCREMENTO**: Adicionar filtros e busca

2. ✅ **Consulta SQL Genérica**
   - **Endpoint**: `POST /api/sgq/query`
   - **Funcionalidade**: Executa queries SQL customizadas
   - **INCREMENTO**: Adicionar validação de queries perigosas

3. ✅ **Listagem de Objetos**
   - **Endpoint**: `GET /api/sgq/list`
   - **Retorna**: Lista de tabelas e views do banco SGQ
   - **INCREMENTO**: Expandir para outros bancos

---

### 🔷 1.4 Módulo de Oráculo IA

#### **Funcionalidade**:
- **Endpoint**: `POST /api/oracle/ask`
- **Descrição**: Análise inteligente de dados usando OpenAI
- **Funcionalidades**:
  - Insights automáticos
  - Narrativa executiva
  - Ações recomendadas
  - Análise de KPIs
- **INCREMENTO**: Adicionar cache de respostas e histórico

---

### 🔷 1.5 Módulo de Autenticação e Segurança

#### **Funcionalidades**:
1. ✅ **NextAuth.js Integration**
   - Autenticação via providers
   - Sessões seguras
   - Middleware de proteção

2. ✅ **Gerenciamento de Credenciais**
   - **Endpoint**: `GET /api/creds`
   - **Endpoint**: `POST /api/creds/update`
   - Armazenamento seguro de credenciais de BD

3. 🔄 **TLS/SSL Inteligente**
   - Múltiplas tentativas de conexão
   - Fallback automático
   - **INCREMENTO**: Cache de configurações TLS

---

## 📊 PARTE 2: RELATÓRIOS A SEREM CRIADOS

### 🔷 2.1 Relatórios de Estrutura

#### **Relatório 1: Visão Geral do Banco**
- **Objetivo**: Apresentar visão geral da estrutura
- **Conteúdo**:
  - Total de tabelas, views, procedures, functions
  - Distribuição por schema
  - Tabelas maiores (por linhas)
  - Tabelas mais referenciadas (por FKs)
- **Formato**: Dashboard interativo + PDF exportável
- **Endpoint**: `GET /api/reports/structure-overview`

#### **Relatório 2: Análise de Relacionamentos**
- **Objetivo**: Mapear relacionamentos entre tabelas
- **Conteúdo**:
  - Grafo de relacionamentos (FKs)
  - Tabelas isoladas (sem FKs)
  - Cadeias de dependências
  - Tabelas fact e dimension
- **Formato**: Visualização gráfica + JSON
- **Endpoint**: `GET /api/reports/relationships`

#### **Relatório 3: Análise de Schemas**
- **Objetivo**: Detalhar cada schema do banco
- **Conteúdo**:
  - Tabelas por schema
  - Views por schema
  - Procedures e functions por schema
  - Estatísticas de uso
- **Formato**: Dashboard + CSV exportável
- **Endpoint**: `GET /api/reports/schemas-analysis`

---

### 🔷 2.2 Relatórios de Segurança

#### **Relatório 4: Dados Sensíveis**
- **Objetivo**: Identificar dados sensíveis (LGPD)
- **Conteúdo**:
  - Colunas com CPF, CNPJ, email, telefone
  - Colunas com senhas, tokens, API keys
  - Dados de saúde e médicos
  - Score de risco por tabela
- **Formato**: Dashboard + Excel exportável
- **Endpoint**: `GET /api/reports/sensitive-data`

#### **Relatório 5: Permissões de Usuários**
- **Objetivo**: Analisar permissões e acessos
- **Conteúdo**:
  - Usuários e seus roles
  - Permissões por objeto
  - Usuários de alto risco
  - Permissões excessivas
- **Formato**: Dashboard + PDF exportável
- **Endpoint**: `GET /api/reports/user-permissions`

#### **Relatório 6: Configurações de Segurança**
- **Objetivo**: Avaliar configurações de segurança
- **Conteúdo**:
  - Configurações de auditoria
  - Criptografia (TDE)
  - Configurações de login
  - Recomendações de segurança
- **Formato**: Dashboard + Markdown exportável
- **Endpoint**: `GET /api/reports/security-config`

---

### 🔷 2.3 Relatórios de Performance

#### **Relatório 7: Análise de Índices**
- **Objetivo**: Otimizar índices do banco
- **Conteúdo**:
  - Índices não utilizados
  - Índices faltando (sugestões)
  - Índices fragmentados
  - Eficiência de índices
- **Formato**: Dashboard + SQL scripts exportáveis
- **Endpoint**: `GET /api/reports/index-analysis`

#### **Relatório 8: Performance de Queries**
- **Objetivo**: Identificar queries lentas
- **Conteúdo**:
  - Top 10 queries mais lentas
  - Queries com maior I/O
  - Queries com maior CPU
  - Recomendações de otimização
- **Formato**: Dashboard + CSV exportável
- **Endpoint**: `GET /api/reports/query-performance`

#### **Relatório 9: Uso de Recursos**
- **Objetivo**: Monitorar uso de recursos
- **Conteúdo**:
  - Uso de memória
  - Uso de CPU
  - I/O por tabela
  - Recomendações de tuning
- **Formato**: Dashboard + Gráficos interativos
- **Endpoint**: `GET /api/reports/resource-usage`

---

### 🔷 2.4 Relatórios de Qualidade de Dados

#### **Relatório 10: Qualidade de Dados**
- **Objetivo**: Avaliar qualidade dos dados
- **Conteúdo**:
  - Padrões de dados detectados
  - Problemas de qualidade (nulos, duplicados)
  - Regras de negócio violadas
  - Score de qualidade por tabela
- **Formato**: Dashboard + Excel exportável
- **Endpoint**: `GET /api/reports/data-quality`

#### **Relatório 11: Análise de Padrões**
- **Objetivo**: Identificar padrões nos dados
- **Conteúdo**:
  - Padrões de distribuição
  - Valores mais frequentes
  - Outliers e anomalias
  - Tendências temporais
- **Formato**: Dashboard + Gráficos interativos
- **Endpoint**: `GET /api/reports/data-patterns`

---

### 🔷 2.5 Relatórios Executivos

#### **Relatório 12: Dashboard Executivo**
- **Objetivo**: Visão executiva do banco
- **Conteúdo**:
  - KPIs principais
  - Resumo de segurança
  - Resumo de performance
  - Recomendações prioritárias
- **Formato**: Dashboard interativo + PDF
- **Endpoint**: `GET /api/reports/executive-dashboard`

#### **Relatório 13: Relatório Completo de Análise**
- **Objetivo**: Relatório consolidado
- **Conteúdo**: Todos os relatórios acima consolidados
- **Formato**: PDF completo + JSON
- **Endpoint**: `GET /api/reports/full-analysis`

---

## 📊 PARTE 3: CONEXÕES COM BANCO DE DADOS

### 🔷 3.1 Configuração de Conexão

#### **Parâmetros de Conexão**:
```typescript
interface ConnectionConfig {
  server: string;        // IP ou hostname
  port: number;         // Porta (padrão: 1433)
  database: string;     // Nome do banco
  user: string;         // Usuário
  password: string;      // Senha
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

#### **Configuração TLS/SSL**:
```typescript
// Múltiplas tentativas automáticas:
1. TLS estrito (encrypt: true, trustServerCertificate: false)
2. TLS com trust (encrypt: true, trustServerCertificate: true)
3. Sem TLS (encrypt: false) - fallback
```

---

### 🔷 3.2 Bancos de Dados Suportados

#### **Banco 1: SGC (Sistema de Gestão Comercial)**
- **Servidor**: 104.234.224.238
- **Porta**: 1445
- **Database**: sgc
- **Usuário**: angrax
- **Uso**: Banco principal do ERP ULTRA

#### **Banco 2: SGQ (Sistema de Gestão de Qualidade)**
- **Servidor**: 104.234.224.238
- **Porta**: 1445
- **Database**: sgq
- **Usuário**: ops
- **Senha**: Suporte2022=Mais
- **Uso**: Sistema CEPALAB

#### **Banco 3: Outros Bancos (Configuráveis)**
- Suporte para múltiplos bancos
- Configuração via interface ou variáveis de ambiente
- Cache de conexões

---

### 🔷 3.3 Pool de Conexões

#### **Configuração Padrão**:
```typescript
pool: {
  max: 5,                    // Máximo 5 conexões simultâneas
  min: 0,                    // Mínimo 0 (cria sob demanda)
  idleTimeoutMillis: 30000   // Fecha conexões idle após 30s
}
```

#### **Gerenciamento**:
- Conexões são fechadas automaticamente após uso
- Pool é reutilizado entre requests
- Timeout de 15s para conexão e request

---

### 🔷 3.4 Variáveis de Ambiente

#### **Configuração via .env.local**:
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

---

## 📊 PARTE 4: ENDPOINTS E APIs

### 🔷 4.1 Endpoints de Análise

| Endpoint | Método | Descrição | Status |
|----------|--------|-----------|--------|
| `/api/analyze` | POST | Análise completa do banco | ✅ |
| `/api/ping-sql` | POST | Teste de conexão | ✅ |
| `/api/health` | GET | Health check | ✅ |

### 🔷 4.2 Endpoints de Exportação

| Endpoint | Método | Descrição | Status |
|----------|--------|-----------|--------|
| `/api/export-schema` | POST | Exporta schema completo | ✅ |
| `/api/export/config` | POST | Exporta configurações | ✅ |
| `/api/export/powerbi` | POST | Prepara para Power BI | ✅ |
| `/api/export/sql-scripts` | POST | Gera scripts SQL | ✅ |
| `/api/export/complete` | POST | Exportação completa | ✅ |

### 🔷 4.3 Endpoints de Consulta

| Endpoint | Método | Descrição | Status |
|----------|--------|-----------|--------|
| `/api/schemas-tables` | POST | Lista schemas e tabelas | ✅ |
| `/api/sgq/list` | GET | Lista objetos do SGQ | ✅ |
| `/api/sgq/query` | POST | Executa query SQL | ✅ |

### 🔷 4.4 Endpoints de Relatórios (A CRIAR)

| Endpoint | Método | Descrição | Status |
|----------|--------|-----------|--------|
| `/api/reports/structure-overview` | GET | Relatório de estrutura | 🔄 |
| `/api/reports/relationships` | GET | Relatório de relacionamentos | 🔄 |
| `/api/reports/schemas-analysis` | GET | Análise de schemas | 🔄 |
| `/api/reports/sensitive-data` | GET | Dados sensíveis | 🔄 |
| `/api/reports/user-permissions` | GET | Permissões de usuários | 🔄 |
| `/api/reports/security-config` | GET | Configurações de segurança | 🔄 |
| `/api/reports/index-analysis` | GET | Análise de índices | 🔄 |
| `/api/reports/query-performance` | GET | Performance de queries | 🔄 |
| `/api/reports/resource-usage` | GET | Uso de recursos | 🔄 |
| `/api/reports/data-quality` | GET | Qualidade de dados | 🔄 |
| `/api/reports/data-patterns` | GET | Padrões de dados | 🔄 |
| `/api/reports/executive-dashboard` | GET | Dashboard executivo | 🔄 |
| `/api/reports/full-analysis` | GET | Relatório completo | 🔄 |

### 🔷 4.5 Endpoints de Autenticação

| Endpoint | Método | Descrição | Status |
|----------|--------|-----------|--------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js | ✅ |
| `/api/creds` | GET | Obter credenciais | ✅ |
| `/api/creds/update` | POST | Atualizar credenciais | ✅ |
| `/api/totp` | GET | TOTP (2FA) | ✅ |

### 🔷 4.6 Endpoints de IA

| Endpoint | Método | Descrição | Status |
|----------|--------|-----------|--------|
| `/api/oracle/ask` | POST | Análise IA de dados | ✅ |

---

## 📊 PARTE 5: COMPONENTES REACT

### 🔷 5.1 Componentes Existentes

1. ✅ **ConnectionForm.tsx** - Formulário de conexão
2. ✅ **AnalysisSummary.tsx** - Resumo da análise
3. ✅ **SecurityDashboard.tsx** - Dashboard de segurança
4. ✅ **PerformanceDashboard.tsx** - Dashboard de performance
5. ✅ **Sidebar.tsx** - Barra lateral
6. ✅ **Topbar.tsx** - Barra superior
7. ✅ **OraclePanel.tsx** - Painel de IA

### 🔷 5.2 Componentes a Criar

1. 🔄 **SchemasTablesView.tsx** - Visualização de schemas/tabelas
2. 🔄 **ReportsList.tsx** - Lista de relatórios
3. 🔄 **ReportViewer.tsx** - Visualizador de relatórios
4. 🔄 **RelationshipGraph.tsx** - Grafo de relacionamentos
5. 🔄 **DataQualityPanel.tsx** - Painel de qualidade
6. 🔄 **ExportManager.tsx** - Gerenciador de exportações
7. 🔄 **ConnectionManager.tsx** - Gerenciador de conexões

---

## 📊 PARTE 6: INTEGRAÇÃO NO CEPALAB.IA

### 🔷 6.1 Estrutura de Pastas

```
cepalabia/
├── app/
│   ├── erp-ultra/              # Nova pasta para ERP ULTRA
│   │   ├── page.tsx            # Página principal
│   │   ├── analyze/
│   │   │   └── page.tsx        # Página de análise
│   │   ├── reports/
│   │   │   └── page.tsx        # Página de relatórios
│   │   └── export/
│   │       └── page.tsx        # Página de exportação
│   └── api/
│       └── erp-ultra/          # APIs do ERP ULTRA
│           ├── analyze/
│           ├── export/
│           └── reports/
├── components/
│   └── erp-ultra/              # Componentes do ERP ULTRA
│       ├── AnalysisSummary.tsx
│       ├── SecurityDashboard.tsx
│       └── ...
└── lib/
    └── erp-ultra/              # Bibliotecas do ERP ULTRA
        ├── sqlInspector.ts
        ├── securityInspector.ts
        └── ...
```

### 🔷 6.2 Menu de Navegação

Adicionar no sidebar do Cepalab.ia:
```typescript
{
  name: "ERP ULTRA Inspector",
  icon: "Database",
  children: [
    { name: "Análise", href: "/erp-ultra/analyze" },
    { name: "Relatórios", href: "/erp-ultra/reports" },
    { name: "Exportação", href: "/erp-ultra/export" },
    { name: "Schemas", href: "/erp-ultra/schemas" }
  ]
}
```

### 🔷 6.3 Autenticação Unificada

- Usar NextAuth.js do Cepalab.ia
- Compartilhar sessões
- Middleware de proteção

### 🔷 6.4 Tema e Estilo

- Adaptar para tema do Cepalab.ia
- Manter funcionalidades
- Integrar com componentes existentes

---

## 📊 PARTE 7: CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Preparação
- [ ] Copiar componentes do ERP ULTRA para Cepalab.ia
- [ ] Copiar bibliotecas (lib/)
- [ ] Copiar APIs (app/api/)
- [ ] Configurar variáveis de ambiente
- [ ] Testar conexões com bancos

### Fase 2: Integração de Componentes
- [ ] Integrar ConnectionForm
- [ ] Integrar AnalysisSummary
- [ ] Integrar SecurityDashboard
- [ ] Integrar PerformanceDashboard
- [ ] Criar SchemasTablesView
- [ ] Adaptar tema e estilo

### Fase 3: Criação de Relatórios
- [ ] Implementar endpoints de relatórios
- [ ] Criar componentes de visualização
- [ ] Adicionar exportação (PDF, Excel, CSV)
- [ ] Implementar agendamento

### Fase 4: Testes
- [ ] Testar conexões com todos os bancos
- [ ] Testar todos os relatórios
- [ ] Testar exportações
- [ ] Testar performance
- [ ] Testar segurança

### Fase 5: Documentação
- [ ] Documentar APIs
- [ ] Documentar componentes
- [ ] Criar guia de uso
- [ ] Criar guia de manutenção

---

## 📊 PARTE 8: DEPENDÊNCIAS

### Dependências Principais:
```json
{
  "next": "^14.2.4",
  "react": "^18",
  "mssql": "^10.0.0",
  "next-auth": "^4.24.0",
  "recharts": "^2.10.0",
  "@radix-ui/react-*": "latest",
  "tailwindcss": "^3.4.0"
}
```

### Dependências Opcionais:
```json
{
  "openai": "^4.0.0",  // Para Oráculo IA
  "pdf-lib": "^1.17.0",  // Para exportação PDF
  "xlsx": "^0.18.0"  // Para exportação Excel
}
```

---

## 📊 PARTE 9: PRÓXIMOS PASSOS

1. **Revisar este documento** com a equipe
2. **Definir prioridades** de implementação
3. **Criar issues** no GitHub para cada tarefa
4. **Iniciar Fase 1** (Preparação)
5. **Testar incrementalmente** cada funcionalidade
6. **Documentar** durante o desenvolvimento

---

**Data de Criação**: $(date)
**Versão**: 1.0
**Status**: 📋 Documento completo para integração

