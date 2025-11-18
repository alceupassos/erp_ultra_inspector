import type { ReactNode } from "react";

export function Sidebar({ children }: { children: ReactNode }) {
  return (
    <aside className="flex w-full max-w-sm flex-col gap-4 border-r border-muted/60 bg-gradient-to-b from-black/60 to-background p-4">
      <div>
        <h1 className="text-lg font-semibold text-primary">
          ERP ULTRA Inspector
        </h1>
        <p className="text-xs text-muted-foreground">
          Scanner gráfico do banco SQL Server em 104.234.224.238:1445
        </p>
      </div>
      {children}
    </aside>
  );
}
