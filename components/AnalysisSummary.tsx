"use client";

import { useMemo } from "react";
import type { AnalysisResult, VulnerabilityMetrics, StructuralKpis } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TablesByCategoryChart } from "@/components/charts/TablesByCategoryChart";
import { RowsByTableChart } from "@/components/charts/RowsByTableChart";
import { VulnerabilityRadarChart } from "@/components/charts/VulnerabilityRadarChart";
import { KpiBarChart } from "@/components/charts/KpiBarChart";
import { Textarea } from "@/components/ui/textarea";
import OraclePanel from "@/components/OraclePanel";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle } from "lucide-react";

type Props = {
  analysis: AnalysisResult | null;
  vulns: VulnerabilityMetrics | null;
  kpis: StructuralKpis | null;
  aiSummary?: string;
};

export function AnalysisSummary({ analysis, vulns, kpis, aiSummary }: Props) {
  const metrics = useMemo(() => {
    if (!analysis) return null;
    const totalTables = analysis.tables.length;
    const totalRows = analysis.tables.reduce((acc, t) => acc + t.rowCount, 0);

    const purposes = new Set(analysis.tables.map((t) => t.purpose));

    return {
      totalTables,
      totalRows,
      distinctAreas: purposes.size
    };
  }, [analysis]);

  if (!analysis || !metrics) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Conecte-se ao banco ERP ULTRA ao lado para ver o mapa completo do sistema, KPIs e vulnerabilidades.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <section className="grid gap-4">
        <Card className="neu-card">
          <CardHeader>
            <CardTitle className="glow-orange">Modelos de Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {[
                { name: "Validação de Conexão SQL", ok: true },
                { name: "Mapeamento de Estrutura", ok: !!analysis },
                { name: "Vulnerabilidade Estrutural", ok: !!vulns },
                { name: "Segurança (dados sensíveis, permissões, auditoria)", ok: !!analysis },
                { name: "Performance (índices, queries, fragmentação)", ok: !!analysis },
                { name: "Qualidade de Dados", ok: false },
                { name: "Relatório (Angra DB Manager)", ok: !!aiSummary }
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 p-3">
                  <div className="text-sm">{t.name}</div>
                  <div className="flex items-center gap-2">
                    {t.ok ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">Executado</Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200">Pendente</Badge>
                    )}
                    {t.ok ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Qtd. de tabelas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics.totalTables}</p>
            <p className="text-xs text-muted-foreground">
              Total de entidades físicas no banco
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Linhas (aprox.)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold truncate">
              {new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(metrics.totalRows)}
            </p>
            <p className="text-xs text-muted-foreground">
              Soma de linhas em todas as tabelas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Áreas funcionais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics.distinctAreas}</p>
            <p className="text-xs text-muted-foreground">
              Agrupamento heurístico (clientes, financeiro, estoque, etc.)
            </p>
          </CardContent>
        </Card>
        {vulns && (
          <Card>
            <CardHeader>
              <CardTitle>Score de risco (heurístico)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {Math.min(
                  100,
                  Math.round(
                    (vulns.missingPrimaryKeyRatio +
                      vulns.tablesWithoutForeignKeysRatio +
                      vulns.nullableKeyLikeColumnsRatio) *
                      100
                  )
                )}
                /100
              </p>
              <p className="text-xs text-muted-foreground">
                Índice composto de vulnerabilidades estruturais
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <TablesByCategoryChart tables={analysis.tables} />
        <RowsByTableChart tables={analysis.tables} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {vulns && <VulnerabilityRadarChart vulns={vulns} />}
        {kpis && <KpiBarChart kpis={kpis} />}
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr,3fr]">
        <Card className="max-h-80 overflow-auto">
          <CardHeader>
            <CardTitle>Mapa de tabelas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-xs">
              {analysis.tables.map((t) => (
                <li key={t.objectId}>
                  <span className="font-mono text-[11px] text-primary">
                    {t.schema}.{t.name}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    — {t.purpose} ({t.rowCount.toLocaleString("pt-BR")} linhas, PK:{" "}
                    {t.primaryKey.length ? t.primaryKey.join(", ") : "N/A"}, FKs:{" "}
                    {t.foreignKeys.length})
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análise descritiva (Angra DB Manager)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              className="h-64 text-xs"
              value={aiSummary || "Sem análise generativa disponível."}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
      <OraclePanel
        area="comercial"
        filters={{}}
        kpis={metrics}
        sampleRows={analysis.tables.slice(0, 5).map(t => ({ table: `${t.schema}.${t.name}`, rows: t.rowCount, pk: t.primaryKey }))}
        metadata={{ totalTables: analysis.tables.length }}
      />
