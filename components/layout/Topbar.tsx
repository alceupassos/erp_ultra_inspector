import Link from "next/link";

export function Topbar() {
  return (
    <header className="flex items-center justify-between border-b border-primary/20 px-6 py-4 bg-gradient-to-r from-[#0a0a0f] via-[#0f0f15] to-[#0a0a0f] backdrop-blur-sm">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground glow-orange-subtle">
          Visão geral do ERP ULTRA
        </p>
        <h2 className="text-base font-bold text-foreground glow-orange">
          Mapa funcional, vulnerabilidades e KPIs do banco SQL Server
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-primary/15 px-4 py-2 text-xs font-semibold text-primary glow-border glow-on-hover">
          Angra DB Manager · Inteligência de Vulnerabilidades & KPIs
        </span>
        <Link href="/cepalab" className="px-4 py-2 rounded-lg glow-border text-xs font-semibold bg-primary/20 text-primary hover:bg-primary/30 transition-all glow-on-hover">
          MicroSaaS CEPALAB
        </Link>
      </div>
    </header>
  );
}
