# CEPALAB - Sistema Completo de Análise e Dashboard

## 📋 Visão Geral do Sistema

O CEPALAB é um sistema ERP/SGC (Sistema de Gestão Comercial) desenvolvido em SQL Server que gerencia vendas, estoque, financeiro e operações logísticas. Este documento apresenta um plano completo para criar uma interface moderna com dashboards interativos usando React, Next.js, Recharts e shadcn/ui.

## 🏗️ Arquitetura do Sistema

### Estrutura de Dados Principal

#### **Tabelas Core**
```sql
-- Tabelas de Cadastro
usuario (id, nome, email, senha, ativo, criado_em)
vendedor (id, nome, comissao, ativo)
cliente (id, nome, cpf_cnpj, email, telefone, endereco, ativo)
produto (id, codigo, descricao, familia, unidade, valor_venda, ativo)
deposito (id, descricao, localizacao, ativo)

-- Tabelas Operacionais
venda (id, numero, cliente_id, vendedor_id, data_venda, total, status)
venda_item (id, venda_id, produto_id, quantidade, valor_unitario, total)
estoque (id, produto_id, deposito_id, quantidade, reservado, disponivel)
pedido (id, numero, cliente_id, data_pedido, status, transportadora_id)
volume (id, numero, pedido_id, peso, cubagem, status)
```

#### **Views Analíticas**
```sql
-- Vendas
v_venda -- Vendas com dados completos do cliente e vendedor
v_venda_item -- Itens das vendas com detalhes do produto
v_venda_item_lucratividade -- Análise de lucratividade por item

-- Estoque
v_estoque -- Posição de estoque por produto e depósito
v_estoque_reservado -- Estoque reservado por pedidos
v_estoque_serial -- Controle de série/IMEI
v_estoque_reservado_pedido -- Estoque reservado por pedido específico

-- Financeiro
v_situacao_caixa -- Posição do caixa por período
v_conta_receber -- Contas a receber por cliente

-- Operações
v_pedido_item_serial -- Rastreamento de série por pedido
v_disponibiliza_todos_pedidos -- Visão geral de todos os pedidos
```

## 🎯 Dashboards e Análises

### 1. Dashboard de Vendas

#### **Métricas Principais**
- Faturamento total do período
- Número de vendas por dia/mês
- Ticket médio
- Top 10 produtos mais vendidos
- Performance por vendedor
- Lucratividade por produto

#### **Componentes React**
```tsx
// components/vendas/Vendas