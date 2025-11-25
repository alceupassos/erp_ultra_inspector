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
      <div className="flex h-full items-center justify-center text-center p-8">
        <div className="max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-lg font-semibold glow-orange mb-2">
            Conecte-se ao banco ERP ULTRA
          </p>
          <p className="text-sm text-muted-foreground glow-orange-subtle">
            Use o formulário ao lado para ver o mapa completo do sistema, KPIs e vulnerabilidades.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <section className="grid gap-4">
        <Card className="neu-card neu-hover">
          <CardHeader>
            <CardTitle className="glow-orange text-lg font-bold">Modelos de Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { name: "Validação de Conexão SQL", ok: true },
                { name: "Mapeamento de Estrutura", ok: !!analysis },
                { name: "Vulnerabilidade Estrutural", ok: !!vulns },
                { name: "Segurança (dados sensíveis, permissões, auditoria)", ok: !!analysis },
                { name: "Performance (índices, queries, fragmentação)", ok: !!analysis },
                { name: "Qualidade de Dados", ok: false },
                { name: "Relatório (Angra DB Manager)", ok: !!aiSummary }
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-primary/20 bg-black/20 p-4 neu-hover">
                  <div className="text-sm text-muted-foreground glow-orange-subtle">{t.name}</div>
                  <div className="flex items-center gap-2">
                    {t.ok ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/40 glow-border">Executado</Badge>
                    ) : (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40 glow-border">Pendente</Badge>
                    )}
                    {t.ok ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 md:grid-cols-4">
        <Card className="neu-card neu-hover">
          <CardHeader>
            <CardTitle className="glow-orange-subtle text-sm font-semibold">Qtd. de tabelas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold glow-orange">{metrics.totalTables}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Total de entidades físicas no banco
            </p>
          </CardContent>
        </Card>
        <Card className="neu-card neu-hover">
          <CardHeader>
            <CardTitle className="glow-orange-subtle text-sm font-semibold">Linhas (aprox.)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold glow-orange truncate">
              {new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(metrics.totalRows)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Soma de linhas em todas as tabelas
            </p>
          </CardContent>
        </Card>
        <Card className="neu-card neu-hover">
          <CardHeader>
            <CardTitle className="glow-orange-subtle text-sm font-semibold">Áreas funcionais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold glow-orange">{metrics.distinctAreas}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Agrupamento heurístico (clientes, financeiro, estoque, etc.)
            </p>
          </CardContent>
        </Card>
        {vulns && (
          <Card className="neu-card neu-hover">
            <CardHeader>
              <CardTitle className="glow-orange-subtle text-sm font-semibold">Score de risco (heurístico)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold glow-orange">
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
              <p className="text-xs text-muted-foreground mt-2">
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
        <Card className="max-h-80 overflow-auto neu-card neu-hover">
          <CardHeader>
            <CardTitle className="glow-orange text-sm font-bold">Mapa de tabelas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs">
              {analysis.tables.map((t) => (
                <li key={t.objectId} className="p-2 rounded-lg bg-black/20 border border-primary/10 hover:border-primary/30 transition-all">
                  <span className="font-mono text-[11px] text-primary glow-orange-subtle">
                    {t.schema}.{t.name}
                  </span>{" "}
                  <span className="text-muted-foreground glow-orange-subtle">
                    — {t.purpose} ({t.rowCount.toLocaleString("pt-BR")} linhas, PK:{" "}
                    {t.primaryKey.length ? t.primaryKey.join(", ") : "N/A"}, FKs:{" "}
                    {t.foreignKeys.length})
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="neu-card neu-hover">
          <CardHeader>
            <CardTitle className="glow-orange text-sm font-bold">Análise descritiva (Angra DB Manager)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              className="h-64 text-xs bg-black/30 border-primary/20 text-muted-foreground glow-orange-subtle"
              value={aiSummary || "Sem análise generativa disponível."}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
