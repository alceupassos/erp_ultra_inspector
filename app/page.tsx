"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ConnectionForm } from "@/components/ConnectionForm";
import { AnalysisSummary } from "@/components/AnalysisSummary";
import { SecurityDashboard } from "@/components/SecurityDashboard";
import { PerformanceDashboard } from "@/components/PerformanceDashboard";
import type { 
  AnalysisResult, 
  VulnerabilityMetrics, 
  StructuralKpis, 
  SecurityMetrics, 
  SensitiveDataInfo, 
  UserPermissionInfo, 
  AuditConfig 
} from "@/lib/types";
import type { 
  PerformanceMetrics, 
  IndexInfo, 
  QueryPerformanceInfo 
} from "@/lib/performanceInspector";

export default function Page() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [vulns, setVulns] = useState<VulnerabilityMetrics | null>(null);
  const [kpis, setKpis] = useState<StructuralKpis | null>(null);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [sensitiveData, setSensitiveData] = useState<SensitiveDataInfo[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermissionInfo[]>([]);
  const [auditConfig, setAuditConfig] = useState<AuditConfig | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [indexAnalysis, setIndexAnalysis] = useState<IndexInfo[]>([]);
  const [queryPerformance, setQueryPerformance] = useState<QueryPerformanceInfo[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'performance'>('overview');
  const [logs, setLogs] = useState<Array<{ ts: number; type: 'info' | 'error' | 'success'; msg: string }>>([]);
  const [connectionSecurity, setConnectionSecurity] = useState<'tls' | 'insecure' | null>(null);
  const defaultConfig = { server: '104.234.224.238', port: 1445, user: 'angrax', database: 'sgc', connTimeout: 15000, reqTimeout: 15000, tds: '7.4' };
  const hasPortIssue = logs.some((l) => l.msg.includes('Porta 1445 inacess'));
  const hasTlsFallback = connectionSecurity === 'insecure';
  const hasLoginIssue = aiSummary?.toLowerCase().includes('elogin') || aiSummary?.toLowerCase().includes('login');
  const hasDbIssue = aiSummary?.toLowerCase().includes('database') || aiSummary?.toLowerCase().includes('banco');
  const hasTdeDisabled = (securityMetrics?.encryptionScore ?? 0) === 0;

  function addLog(msg: string, type: 'info' | 'error' | 'success' = 'info') {
    setLogs((prev) => [...prev, { ts: Date.now(), type, msg }].slice(-200));
  }

  function handleAnalysis(data: any) {
    if (data?.analysis) {
      setAnalysis(data.analysis);
      setVulns(data.vulns ?? null);
      setKpis(data.kpis ?? null);
      setSecurityMetrics(data.securityMetrics ?? null);
      setSensitiveData(data.sensitiveData ?? []);
      setUserPermissions(data.userPermissions ?? []);
      setAuditConfig(data.auditConfig ?? null);
      setPerformanceMetrics(data.performanceMetrics ?? null);
      setIndexAnalysis(data.indexAnalysis ?? []);
      setQueryPerformance(data.queryPerformance ?? []);
      setRecommendations(data.recommendations ?? []);
      setAiSummary(data.aiSummary ?? "");
      setConnectionSecurity(data.connectionSecurity ?? null);
    } else {
      setAnalysis(null);
      setVulns(null);
      setKpis(null);
      setSecurityMetrics(null);
      setSensitiveData([]);
      setUserPermissions([]);
      setAuditConfig(null);
      setPerformanceMetrics(null);
      setIndexAnalysis([]);
      setQueryPerformance([]);
      setRecommendations([]);
      setAiSummary(data?.error ?? "Erro ao analisar banco.");
      setConnectionSecurity(null);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-dark-gradient">
      <Topbar />
      <div className="fixed top-3 left-3 z-50">
        <button
          className="px-3 py-2 rounded-lg glow-border bg-primary/20 text-primary glow-on-hover hover:bg-primary/30 transition-all"
          onClick={async () => {
            if (status === "authenticated") { router.push("/landing"); return; }
            const r = await fetch("/api/totp"); const j = await r.json();
            await signIn("credentials", { code: j.code, redirect: false });
            router.push("/landing");
          }}
        >Ir para Landing</button>
      </div>
      <main className="flex flex-1 overflow-hidden h-full">
        <Sidebar>
          <ConnectionForm
            onAnalysis={handleAnalysis}
            loading={loading}
            setLoading={setLoading}
            onLog={addLog}
          />
        </Sidebar>
        <section className="flex flex-1 flex-col overflow-hidden bg-dark-gradient">
          {/* Navegação por Abas */}
          {analysis && (
            <div className="border-b border-primary/20 bg-transparent">
              <div className="flex space-x-1 px-6 pt-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 text-sm font-semibold rounded-t-xl transition-all glow-on-hover ${
                    activeTab === 'overview'
                      ? 'glow-orange bg-primary/10 glow-border-strong border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  Visão Geral
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-6 py-3 text-sm font-semibold rounded-t-xl transition-all glow-on-hover ${
                    activeTab === 'security'
                      ? 'glow-orange bg-primary/10 glow-border-strong border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  Segurança & Conformidade
                </button>
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`px-6 py-3 text-sm font-semibold rounded-t-xl transition-all glow-on-hover ${
                    activeTab === 'performance'
                      ? 'glow-orange bg-primary/10 glow-border-strong border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  Performance & Otimização
                </button>
              </div>
            </div>
          )}
          
          {/* Conteúdo das Abas */}
          <div className="flex-1 overflow-auto">
            <div className="px-6 py-4">
              <div className="max-w-4xl mx-auto">
                <div className="neu-card rounded-2xl p-5 neu-hover">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold glow-orange animated-pulse-glow">Log de Sessão</h3>
                    <button
                      onClick={() => setLogs([])}
                      className="text-xs px-3 py-1.5 rounded-lg glow-border bg-primary/20 text-primary hover:bg-primary/30 transition-all"
                    >
                      Limpar
                    </button>
                  </div>
                  <div className="h-40 overflow-auto bg-black/30 rounded-xl border border-primary/20 p-4 backdrop-blur-sm">
                    {logs.length === 0 ? (
                      <div className="text-xs text-muted-foreground">Sem eventos</div>
                    ) : (
                      <ul className="space-y-1.5">
                        {logs.map((l, i) => (
                          <li key={i} className="text-[12px] font-mono">
                            <span className="text-muted-foreground mr-3">
                              {new Date(l.ts).toLocaleTimeString('pt-BR')}
                            </span>
                            <span className={
                              l.type === 'error' 
                                ? 'text-red-400 glow-orange-soft' 
                                : l.type === 'success' 
                                ? 'text-green-400 glow-orange-soft' 
                                : 'text-primary glow-orange-subtle'
                            }>
                              {l.msg}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="neu-card rounded-2xl p-5 mt-4 neu-hover">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold glow-orange">Configurações em uso</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-muted-foreground">Servidor</div><div className="text-primary glow-orange-subtle font-mono">{defaultConfig.server}</div>
                    <div className="text-muted-foreground">Porta</div><div className="text-primary glow-orange-subtle font-mono">{defaultConfig.port}</div>
                    <div className="text-muted-foreground">Banco de dados</div><div className="text-primary glow-orange-subtle font-mono">{analysis?.database || defaultConfig.database}</div>
                    <div className="text-muted-foreground">Usuário</div><div className="text-primary glow-orange-subtle font-mono">{defaultConfig.user}</div>
                    <div className="text-muted-foreground">TLS</div><div className="text-primary glow-orange-subtle">{connectionSecurity === 'tls' ? '✓ Segura via TLS/SSL' : connectionSecurity === 'insecure' ? '⚠ Insegura (TrustServerCertificate)' : 'Auto: tenta TLS, fallback inseguro'}</div>
                    <div className="text-muted-foreground">Timeout conexão</div><div className="text-primary glow-orange-subtle">{defaultConfig.connTimeout} ms</div>
                    <div className="text-muted-foreground">Timeout requisição</div><div className="text-primary glow-orange-subtle">{defaultConfig.reqTimeout} ms</div>
                    <div className="text-muted-foreground">TDS</div><div className="text-primary glow-orange-subtle">{defaultConfig.tds}</div>
                  </div>
                </div>
                <div className="neu-card rounded-2xl p-5 mt-4 neu-hover">
                  <div className="mb-3">
                    <h3 className="text-base font-bold glow-orange">Sugestões para resolução</h3>
                  </div>
                  <ul className="text-sm space-y-2">
                    <li className={hasLoginIssue ? 'text-red-400 glow-orange-soft' : 'text-muted-foreground'}>• Verificar usuário/senha e permissões no banco.</li>
                    <li className={hasPortIssue ? 'text-red-400 glow-orange-soft' : 'text-muted-foreground'}>• Liberar porta 1445 no firewall/NAT.</li>
                    <li className={hasTlsFallback ? 'text-red-400 glow-orange-soft' : 'text-muted-foreground'}>• Configurar certificado TLS no SQL Server e usar FQDN.</li>
                    <li className={hasDbIssue ? 'text-red-400 glow-orange-soft' : 'text-muted-foreground'}>• Confirmar nome do database e acesso do login.</li>
                    <li className={hasTdeDisabled ? 'text-red-400 glow-orange-soft' : 'text-muted-foreground'}>• Habilitar TDE no database (criptografia transparente em repouso).</li>
                  </ul>
                </div>
              </div>
            </div>
            {activeTab === 'overview' && (
              <AnalysisSummary
                analysis={analysis}
                vulns={vulns}
                kpis={kpis}
                aiSummary={aiSummary}
              />
            )}
            {activeTab === 'security' && (
              <SecurityDashboard
                securityMetrics={securityMetrics}
                sensitiveData={sensitiveData}
                userPermissions={userPermissions}
                auditConfig={auditConfig}
              />
            )}
            {activeTab === 'performance' && (
              <PerformanceDashboard
                performanceMetrics={performanceMetrics}
                indexAnalysis={indexAnalysis}
                queryPerformance={queryPerformance}
                recommendations={recommendations}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
