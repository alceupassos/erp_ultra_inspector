import type { AnalysisResult, VulnerabilityMetrics, StructuralKpis } from "./types";

export function computeVulnerabilityMetrics(analysis: AnalysisResult): VulnerabilityMetrics {
  const total = analysis.tables.length || 1;

  const missingPk = analysis.tables.filter((t) => t.primaryKey.length === 0).length;
  const noFk = analysis.tables.filter((t) => t.foreignKeys.length === 0).length;

  const keyLikeNullableCols = analysis.tables.flatMap((t) =>
    t.columns.filter((c) => {
      const n = c.column_name.toLowerCase();
      const looksKey =
        n.includes("cpf") ||
        n.includes("cnpj") ||
        n.includes("documento") ||
        n.includes("email") ||
        n.includes("telefone") ||
        n.includes("celular") ||
        n.includes("address") ||
        n.includes("endereco");
      return looksKey && c.is_nullable;
    })
  );

  const sensitiveCols = analysis.tables.flatMap((t) =>
    t.columns.filter((c) => {
      const n = c.column_name.toLowerCase();
      return (
        n.includes("senha") ||
        n.includes("password") ||
        n.includes("token") ||
        n.includes("cpf") ||
        n.includes("cnpj") ||
        n.includes("cartao") ||
        n.includes("health") ||
        n.includes("saude") ||
        n.includes("hepatite") ||
        n.includes("diagnostico")
      );
    })
  );

  return {
    missingPrimaryKeyRatio: missingPk / total,
    tablesWithoutForeignKeysRatio: noFk / total,
    nullableKeyLikeColumnsRatio: keyLikeNullableCols.length / (total || 1),
    potentialSensitiveColumns: sensitiveCols.length,
    totalTables: analysis.tables.length
  };
}

export function computeStructuralKpis(analysis: AnalysisResult): StructuralKpis {
  const total = analysis.tables.length || 1;

  const totalCols = analysis.tables.reduce((acc, t) => acc + t.columns.length, 0);
  const totalRows = analysis.tables.reduce((acc, t) => acc + t.rowCount, 0);
  const maxRows = analysis.tables.reduce(
    (max, t) => (t.rowCount > max ? t.rowCount : max),
    0
  );
  const totalFks = analysis.tables.reduce((acc, t) => acc + t.foreignKeys.length, 0);

  return {
    avgColumnsPerTable: totalCols / total,
    avgRowCount: totalRows / total,
    maxRowCount: maxRows,
    fkPerTableAvg: totalFks / total
  };
}
