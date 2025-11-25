"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { TableInfo } from "@/lib/types";

type Props = {
  tables: TableInfo[];
};

export function RowsByTableChart({ tables }: Props) {
  const sorted = [...tables]
    .filter((t) => t.rowCount > 0)
    .sort((a, b) => b.rowCount - a.rowCount)
    .slice(0, 12);

  const data = sorted.map((t) => ({
    table: `${t.schema}.${t.name}`,
    rows: t.rowCount
  }));

  if (!data.length) return null;

  return (
    <Card className="h-72 neu-card">
      <CardHeader>
        <CardTitle className="glow-orange">Top 12 tabelas por volume de dados</CardTitle>
      </CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
            <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <YAxis
              dataKey="table"
              type="category"
              tick={{ fontSize: 9, fill: "#ff8a1f" }}
              width={140}
            />
            <Tooltip
              contentStyle={{
                background: "#0d1326",
                border: "1px solid rgba(255,122,0,0.35)",
                borderRadius: 12,
                fontSize: 11
              }}
            />
            <Bar dataKey="rows" fill="#ff8a1f" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
