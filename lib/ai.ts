import type { AnalysisResult, VulnerabilityMetrics, StructuralKpis } from "./types";

export async function describeSchemaWithAI(input: {
  analysis: AnalysisResult;
  vulns: VulnerabilityMetrics;
  kpis: StructuralKpis;
}): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return "API key da OpenAI (OPENAI_API_KEY) não configurada. Configure para habilitar a análise generativa de vulnerabilidades e oportunidades.";
  }

  const { analysis, vulns, kpis } = input;
  const safeAvgCols = Number(kpis?.avgColumnsPerTable ?? 0).toFixed(2);
  const safeAvgRows = Number(kpis?.avgRowCount ?? 0).toFixed(2);
  const safeMaxRows = Number(kpis?.maxRowCount ?? 0);
  const safeFkAvg = Number(kpis?.fkPerTableAvg ?? 0).toFixed(2);

  const prompt = `
Você é um arquiteto de dados e especialista em segurança para ERPs de saúde e gestão, usando SQL Server.
Você recebeu uma radiografia de um banco de dados do ERP ULTRA, com tabelas, finalidades heurísticas, métricas estruturais e indicadores de vulnerabilidade.

Sua missão:
1. Descrever, em português técnico mas claro, como parece ser a arquitetura lógica deste ERP (módulos, relacionamentos implícitos).
2. Apontar vulnerabilidades potenciais do ponto de vista de modelagem de dados, segurança, LGPD e governança (com foco em chaves primárias ausentes, ausência de FKs, colunas sensíveis etc.).
3. Propor KPIs de saúde do banco (data health KPIs) e o que cada um significa para o CFO, para o Diretor Médico (se aplicável) e para o time de TI.
4. Sugerir oportunidades de uso de IA (como oráculos de gestão, alertas, fluxos automáticos) baseadas nessa fotografia.
5. Descrever como você desenharia um painel de vulnerabilidades: seções, gráficos, fluxogramas e narrativa.

Dados do banco:
- Servidor: ${analysis.server}:${analysis.port}
- Database: ${analysis.database}
- Total de tabelas: ${analysis.tables.length}

Métricas estruturais:
- Média de colunas por tabela: ${safeAvgCols}
- Média de linhas por tabela: ${safeAvgRows}
- Máximo de linhas em uma tabela: ${safeMaxRows}
- FKs por tabela (média): ${safeFkAvg}

Métricas de vulnerabilidade (heurísticas):
- Proporção de tabelas sem chave primária definida: ${(vulns.missingPrimaryKeyRatio * 100).toFixed(1)}%
- Proporção de tabelas sem nenhuma foreign key: ${(vulns.tablesWithoutForeignKeysRatio * 100).toFixed(1)}%
- Colunas com cara de identificador pessoal (CPF/CNPJ/email/etc.) que são nulas: índice ${(
    vulns.nullableKeyLikeColumnsRatio * 100
  ).toFixed(1)}% relativo ao número de tabelas
- Quantidade de colunas potencialmente sensíveis (senha/token/documentos/dados de saúde): ${
    vulns.potentialSensitiveColumns
  }

Algumas tabelas mapeadas:
${analysis.tables
  .slice(0, 40)
  .map(
    (t) =>
      `- ${t.schema}.${t.name} | finalidade: ${t.purpose} | linhas: ${t.rowCount} | PK: ${
        t.primaryKey.length ? t.primaryKey.join(",") : "N/A"
      } | FKs: ${t.foreignKeys.length}`
  )
  .join("\n")}

Agora faça uma análise profunda e criativa, como se estivesse preparando um relatório executivo e técnico ao mesmo tempo, incluindo seções, bullet points, e sugestões de fluxos/diagramas que poderiam virar gráficos no front-end.
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5.1",
      input: prompt
    })
  });

  if (!response.ok) {
    return `Falha ao chamar Angra DB Manager: ${response.status} ${response.statusText}`;
  }

  const json = await response.json();
  const text =
    json.output?.[0]?.content?.[0]?.text ??
    json.content?.[0]?.text ??
    JSON.stringify(json, null, 2);

  return text;
}
