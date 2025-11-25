import type { ReactNode } from "react";

export function Sidebar({ children }: { children: ReactNode }) {
  return (
    <aside className="flex w-full max-w-sm flex-col gap-4 border-r border-primary/20 bg-gradient-to-b from-black/80 via-[#0a0a0f] to-[#0a0a0f] p-6 backdrop-blur-sm">
      <div className="mb-4">
        <h1 className="text-2xl font-bold glow-orange animated-pulse-glow mb-2">
          ERP ULTRA Inspector
        </h1>
        <p className="text-sm text-muted-foreground glow-orange-subtle">
          Scanner gráfico do banco SQL Server em 104.234.224.238:1445
        </p>
        <div className="mt-3 text-xs text-muted-foreground">
          <span className="glow-orange-subtle">🔍 Análise Profunda</span> • <span className="glow-orange-subtle">🛡️ Segurança</span> • <span className="glow-orange-subtle">⚡ Performance</span>
        </div>
      </div>
      {children}
    </aside>
  );
}
