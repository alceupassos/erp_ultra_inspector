export function classifyTable(tableName: string): string {
  const n = tableName.toLowerCase();

  if (n.includes("usuario") || n.includes("user") || n.includes("login")) {
    return "Usuários / Acesso";
  }
  if (n.includes("cliente") || n.includes("paciente") || n.includes("cli")) {
    return "Clientes / Pacientes";
  }
  if (n.includes("fornecedor") || n.includes("forn")) {
    return "Fornecedores";
  }
  if (n.includes("produto") || n.includes("item") || n.includes("servico")) {
    return "Produtos / Serviços";
  }
  if (n.includes("pedido") || n.includes("orcamento") || n.includes("venda")) {
    return "Vendas / Pedidos";
  }
  if (
    n.includes("titulo") ||
    n.includes("contas") ||
    n.includes("pagar") ||
    n.includes("receber")
  ) {
    return "Financeiro (títulos / contas)";
  }
  if (n.includes("estoque") || n.includes("movesto") || n.includes("mov_esto")) {
    return "Estoque / Movimentação";
  }
  if (n.includes("nota") || n.includes("nf") || n.includes("fiscal")) {
    return "Documentos fiscais";
  }
  if (n.includes("funcionario") || n.includes("colaborador") || n.includes("rh")) {
    return "RH / Funcionários";
  }
  if (n.includes("config") || n.includes("param") || n.includes("parametro")) {
    return "Configurações / Parâmetros";
  }

  return "Outras / Não classificada";
}
