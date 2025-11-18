import Link from "next/link";

export function Topbar() {
  return (
    <header className="flex items-center justify-between border-b border-muted/60 px-6 py-3">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Visão geral do ERP ULTRA
        </p>
        <h2 className="text-sm font-medium text-foreground">
          Mapa funcional, vulnerabilidades e KPIs do banco SQL Server
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary glow-border">
          Angra DB Manager · Inteligência de Vulnerabilidades & KPIs
        </span>
        <Link href="/cepalab" className="px-3 py-1 rounded glow-border text-xs bg-primary text-primary-foreground">
          MicroSaaS CEPALAB
        </Link>
      </div>
    </header>
  );
}
