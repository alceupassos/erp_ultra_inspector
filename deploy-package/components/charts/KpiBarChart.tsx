"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { StructuralKpis } from "@/lib/types";

type Props = {
  kpis?: StructuralKpis | null;
};

export function KpiBarChart({ kpis }: Props) {
  const data = [
    {
      name: "Cols / tabela",
      value: Number((kpis?.avgColumnsPerTable ?? 0).toFixed?.(2) ?? 0)
    },
    {
      name: "FKs / tabela",
      value: Number((kpis?.fkPerTableAvg ?? 0).toFixed?.(2) ?? 0)
    },
    {
      name: "Média linhas",
      value: Number((kpis?.avgRowCount ?? 0).toFixed?.(2) ?? 0)
    }
  ];

  return (
    <Card className="h-72">
      <CardHeader>
        <CardTitle>KPIs estruturais do ERP ULTRA</CardTitle>
      </CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, left: 0, right: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
            />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <Tooltip
              contentStyle={{
                background: "#020617",
                border: "1px solid #1f2937",
                borderRadius: 12,
                fontSize: 11
              }}
            />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
