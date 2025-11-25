"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Shield,
  Zap,
  Database,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Report = {
  id: string;
  name: string;
  description: string;
  category: "structure" | "security" | "performance" | "quality" | "executive";
  icon: React.ReactNode;
  endpoint: string;
  formats: string[];
};

const reports: Report[] = [
  {
    id: "structure-overview",
    name: "Visão Geral do Banco",
    description: "Total de tabelas, views, procedures e distribuição por schema",
    category: "structure",
    icon: <Database className="h-5 w-5" />,
    endpoint: "/api/reports/structure-overview",
    formats: ["PDF", "JSON"],
  },
  {
    id: "relationships",
    name: "Análise de Relacionamentos",
    description: "Grafo de relacionamentos entre tabelas e cadeias de dependências",
    category: "structure",
    icon: <BarChart3 className="h-5 w-5" />,
    endpoint: "/api/reports/relationships",
    formats: ["JSON", "Graph"],
  },
  {
    id: "schemas-analysis",
    name: "Análise de Schemas",
    description: "Detalhamento de cada schema com estatísticas de uso",
    category: "structure",
    icon: <FileText className="h-5 w-5" />,
    endpoint: "/api/reports/schemas-analysis",
    formats: ["CSV", "JSON"],
  },
  {
    id: "sensitive-data",
    name: "Dados Sensíveis (LGPD)",
    description: "Identificação de dados sensíveis e score de risco por tabela",
    category: "security",
    icon: <Shield className="h-5 w-5" />,
    endpoint: "/api/reports/sensitive-data",
    formats: ["Excel", "JSON"],
  },
  {
    id: "user-permissions",
    name: "Permissões de Usuários",
    description: "Análise de permissões, roles e usuários de alto risco",
    category: "security",
    icon: <Shield className="h-5 w-5" />,
    endpoint: "/api/reports/user-permissions",
    formats: ["PDF", "JSON"],
  },
  {
    id: "security-config",
    name: "Configurações de Segurança",
    description: "Avaliação de configurações de auditoria, criptografia e login",
    category: "security",
    icon: <AlertTriangle className="h-5 w-5" />,
    endpoint: "/api/reports/security-config",
    formats: ["Markdown", "JSON"],
  },
  {
    id: "index-analysis",
    name: "Análise de Índices",
    description: "Índices não utilizados, faltando e fragmentados com scripts SQL",
    category: "performance",
    icon: <Zap className="h-5 w-5" />,
    endpoint: "/api/reports/index-analysis",
    formats: ["SQL", "JSON"],
  },
  {
    id: "query-performance",
    name: "Performance de Queries",
    description: "Top 10 queries mais lentas e recomendações de otimização",
    category: "performance",
    icon: <TrendingUp className="h-5 w-5" />,
    endpoint: "/api/reports/query-performance",
    formats: ["CSV", "JSON"],
  },
  {
    id: "resource-usage",
    name: "Uso de Recursos",
    description: "Monitoramento de memória, CPU e I/O por tabela",
    category: "performance",
    icon: <BarChart3 className="h-5 w-5" />,
    endpoint: "/api/reports/resource-usage",
    formats: ["JSON", "Graph"],
  },
  {
    id: "data-quality",
    name: "Qualidade de Dados",
    description: "Padrões detectados, problemas de qualidade e score por tabela",
    category: "quality",
    icon: <CheckCircle className="h-5 w-5" />,
    endpoint: "/api/reports/data-quality",
    formats: ["Excel", "JSON"],
  },
  {
    id: "data-patterns",
    name: "Análise de Padrões",
    description: "Padrões de distribuição, outliers e tendências temporais",
    category: "quality",
    icon: <BarChart3 className="h-5 w-5" />,
    endpoint: "/api/reports/data-patterns",
    formats: ["JSON", "Graph"],
  },
  {
    id: "executive-dashboard",
    name: "Dashboard Executivo",
    description: "Visão executiva com KPIs principais e recomendações prioritárias",
    category: "executive",
    icon: <BarChart3 className="h-5 w-5" />,
    endpoint: "/api/reports/executive-dashboard",
    formats: ["PDF", "JSON"],
  },
  {
    id: "full-analysis",
    name: "Relatório Completo de Análise",
    description: "Consolidação de todos os relatórios em um único documento",
    category: "executive",
    icon: <FileText className="h-5 w-5" />,
    endpoint: "/api/reports/full-analysis",
    formats: ["PDF", "JSON"],
  },
];

const categoryColors = {
  structure: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  security: "bg-red-500/20 text-red-400 border-red-500/30",
  performance: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  quality: "bg-green-500/20 text-green-400 border-green-500/30",
  executive: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const categoryLabels = {
  structure: "Estrutura",
  security: "Segurança",
  performance: "Performance",
  quality: "Qualidade",
  executive: "Executivo",
};

type Props = {
  onSelectReport?: (report: Report) => void;
  onGenerateReport?: (report: Report, format: string) => void;
};

export function ReportsList({ onSelectReport, onGenerateReport }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredReports = selectedCategory
    ? reports.filter((r) => r.category === selectedCategory)
    : reports;

  const categories = Array.from(new Set(reports.map((r) => r.category)));

  return (
    <div className="space-y-4">
      {/* Filtros por Categoria */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className="glow-border"
        >
          Todos
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className="glow-border"
          >
            {categoryLabels[cat as keyof typeof categoryLabels]}
          </Button>
        ))}
      </div>

      {/* Lista de Relatórios */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="neu-card neu-hover">
            <CardHeader className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="text-primary">{report.icon}</div>
                  <CardTitle className="text-sm font-bold glow-orange">{report.name}</CardTitle>
                </div>
                <Badge className={categoryColors[report.category]}>{categoryLabels[report.category]}</Badge>
              </div>
              <p className="text-xs text-muted-foreground glow-orange-subtle">{report.description}</p>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {report.formats.map((format) => (
                    <Badge key={format} variant="outline" className="text-xs">
                      {format}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  {onSelectReport && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSelectReport(report)}
                      className="h-7 px-2"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                  {onGenerateReport && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onGenerateReport(report, report.formats[0])}
                      className="h-7 px-2"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <Card className="neu-card neu-hover">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground glow-orange-subtle">
              Nenhum relatório encontrado nesta categoria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

