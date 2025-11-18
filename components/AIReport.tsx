"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Shield,
  Zap,
  Database,
  Users,
  Clock,
  ArrowRight,
  Download,
  Copy,
  RefreshCw
} from "lucide-react";

interface AIReportProps {
  aiSummary: string;
  analysis: any;
  vulns: any;
  kpis: any;
  securityMetrics: any;
  performanceMetrics: any;
  onRegenerate?: () => void;
  isLoading?: boolean;
}

export function AIReport({ 
  aiSummary, 
  analysis, 
  vulns, 
  kpis, 
  securityMetrics, 
  performanceMetrics,
  onRegenerate,
  isLoading
}: AIReportProps) {
  const [copied, setCopied] = useState(false);

  if (!aiSummary && !isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Brain className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Análise IA Não Disponível</h3>
          <p className="text-sm text-gray-500 max-w-md">
            Conecte-se ao banco de dados para gerar uma análise completa com inteligência artificial.
          </p>
        </CardContent>
      </Card>
    );
  }

  const copyToClipboard = async () => {
    if (aiSummary) {
      await navigator.clipboard.writeText(aiSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadReport = () => {
    const report = generateFullReport();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analise-banco-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateFullReport = () => {
    return `# Relatório de Análise de Banco de Dados - ${new Date().toLocaleDateString('pt-BR')}

## 📊 Resumo Executivo

${aiSummary}

## 🔍 Análise Detalhada

### Estrutura do Banco
- **Total de Tabelas**: ${analysis?.tables?.length || 0}
- **Linhas Totais**: ${analysis?.tables?.reduce((acc: number, t: any) => acc + t.rowCount, 0).toLocaleString('pt-BR') || 0}
- **Áreas Funcionais**: ${new Set(analysis?.tables?.map((t: any) => t.purpose)).size || 0}

### KPIs Estruturais
- **Média de Colunas por Tabela**: ${kpis?.avgColumnsPerTable?.toFixed(1) || 0}
- **Média de Linhas**: ${kpis?.avgRowCount?.toLocaleString('pt-BR') || 0}
- **Máximo de Linhas**: ${kpis?.maxRowCount?.toLocaleString('pt-BR') || 0}

### Análise de Segurança
${securityMetrics ? `
- **Pontuação Geral**: ${securityMetrics.overallSecurityScore}/100
- **Dados Sensíveis**: ${securityMetrics.totalSensitiveColumns} colunas
- **Usuários de Alto Risco**: ${securityMetrics.highRiskUsers}
- **Características Perigosas**: ${securityMetrics.dangerousFeaturesEnabled}
` : 'Análise de segurança não disponível'}

### Análise de Performance
${performanceMetrics ? `
- **Pontuação Geral**: ${performanceMetrics.overallPerformanceScore}/100
- **Tempo Médio de Query**: ${performanceMetrics.avgQueryTime}ms
- **Queries Lentas**: ${performanceMetrics.slowQueries}
- **Índices Fragmentados**: ${performanceMetrics.fragmentedIndexes}
` : 'Análise de performance não disponível'}

### Vulnerabilidades Identificadas
${vulns ? `
- **Tabelas sem PK**: ${(vulns.missingPrimaryKeyRatio * 100).toFixed(1)}%
- **Tabelas sem FK**: ${(vulns.tablesWithoutForeignKeysRatio * 100).toFixed(1)}%
- **Colunas Nuláveis**: ${(vulns.nullableKeyLikeColumnsRatio * 100).toFixed(1)}%
` : 'Análise de vulnerabilidades não disponível'}

## 💡 Recomendações

### Prioridades Críticas
1. **Revisar dados sensíveis** - Implementar criptografia e controle de acesso
2. **Otimizar índices** - Reorganizar índices fragmentados
3. **Revisar queries lentas** - Otimizar consultas com performance crítica

### Ações de Médio Prazo
1. **Implementar auditoria** - Habilitar logs de auditoria para conformidade
2. **Revisar permissões** - Ajustar privilégios de usuários
3. **Documentar estrutura** - Criar documentação técnica completa

### Melhorias Contínuas
1. **Monitoramento** - Implementar monitoramento de performance
2. **Backup e recuperação** - Verificar políticas de backup
3. **Manutenção preventiva** - Agendar manutenção regular de índices

---
*Relatório gerado automaticamente por ERP Ultra Inspector com IA*
`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Crítico';
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-[#ff8a1f] glow-orange soft-bounce" />
          <div>
            <h2 className="text-2xl font-bold glow-orange">Análise com Inteligência Artificial</h2>
            <p className="text-sm text-muted-foreground">Análise gerada por IA com base nos dados do seu banco</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors bg-primary text-primary-foreground glow-border hover:bg-[#ff8a1f]"
            disabled={!aiSummary}
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors bg-primary/20 text-[#ff8a1f] glow-border hover:bg-primary/30"
            disabled={!aiSummary}
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors bg-primary/20 text-[#ff8a1f] glow-border hover:bg-primary/30"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Regenerar
            </button>
          )}
        </div>
      </div>

      {/* Cards de Score */}
      <div className="grid gap-4 md:grid-cols-3">
        {securityMetrics && (
          <Card className="border-l-4 border-l-[#ff8a1f]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold glow-orange`}>
                {securityMetrics.overallSecurityScore}/100
              </div>
              <Badge className={`text-xs mt-1 bg-primary/20 text-[#ff8a1f] border-[#ff8a1f]/40`}>
                {getScoreLabel(securityMetrics.overallSecurityScore)}
              </Badge>
            </CardContent>
          </Card>
        )}

        {performanceMetrics && (
          <Card className="border-l-4 border-l-[#ff8a1f]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold glow-orange`}>
                {performanceMetrics.overallPerformanceScore}/100
              </div>
              <Badge className={`text-xs mt-1 bg-primary/20 text-[#ff8a1f] border-[#ff8a1f]/40`}>
                {getScoreLabel(performanceMetrics.overallPerformanceScore)}
              </Badge>
            </CardContent>
          </Card>
        )}

        {vulns && (
          <Card className="border-l-4 border-l-[#ff8a1f]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Vulnerabilidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold glow-orange">
                {Math.round((vulns.missingPrimaryKeyRatio + vulns.tablesWithoutForeignKeysRatio + vulns.nullableKeyLikeColumnsRatio) * 100)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Score de risco</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Análise Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#ff8a1f] glow-orange" />
            Análise Detalhada
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-gray-500">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Gerando análise com IA...</span>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <div className="rounded-2xl p-4 neu-card">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {aiSummary}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métricas Rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="neu-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium glow-orange flex items-center gap-1">
              <Database className="w-3 h-3" />
              Tabelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold glow-orange animated-pulse-glow">
              {analysis?.tables?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {new Set(analysis?.tables?.map((t: any) => t.purpose)).size || 0} áreas
            </div>
          </CardContent>
        </Card>

        <Card className="neu-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium glow-orange flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Linhas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold glow-orange animated-pulse-glow">
              {analysis?.tables?.reduce((acc: number, t: any) => acc + t.rowCount, 0).toLocaleString('pt-BR') || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total acumulado
            </div>
          </CardContent>
        </Card>

        <Card className="neu-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium glow-orange flex items-center gap-1">
              <Users className="w-3 h-3" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold glow-orange animated-pulse-glow">
              {securityMetrics?.totalSensitiveColumns || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Dados sensíveis
            </div>
          </CardContent>
        </Card>

        <Card className="neu-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium glow-orange flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold glow-orange animated-pulse-glow">
              {performanceMetrics?.avgQueryTime || 0}ms
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Tempo médio
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contexto RAG da CEPALAB */}
      <RagCepalabSection />
    </div>
  );
}

import { RagCepalabSection } from "@/lib/rag/cepalab";