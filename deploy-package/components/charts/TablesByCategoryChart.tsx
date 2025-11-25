"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { TableInfo } from "@/lib/types";

type Props = {
  tables: TableInfo[];
};

export function TablesByCategoryChart({ tables }: Props) {
  const byCategory: Record<string, number> = {};
  tables.forEach((t) => {
    byCategory[t.purpose] = (byCategory[t.purpose] ?? 0) + 1;
  });

  const data = Object.entries(byCategory).map(([name, value]) => ({
    category: name,
    count: value
  }));

  if (!data.length) return null;

  return (
    <Card className="h-72 neu-card">
      <CardHeader>
        <CardTitle className="glow-orange">Tabelas por área funcional (heurística)</CardTitle>
      </CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, left: 0, right: 0 }}>
            <XAxis
              dataKey="category"
              tick={{ fontSize: 10, fill: "#ff8a1f" }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <Tooltip
              contentStyle={{
                background: "#0d1326",
                border: "1px solid rgba(255,122,0,0.35)",
                borderRadius: 12,
                fontSize: 11
              }}
            />
            <Bar dataKey="count" fill="#ff8a1f" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
