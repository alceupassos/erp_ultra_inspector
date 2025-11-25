"use client";

import { useMemo } from "react";
import type { PerformanceMetrics, IndexInfo, QueryPerformanceInfo } from "@/lib/performanceInspector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Database, 
  Clock, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity,
  Settings,
  Wrench
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";

interface PerformanceDashboardProps {
  performanceMetrics: PerformanceMetrics | null;
  indexAnalysis: IndexInfo[];
  queryPerformance: QueryPerformanceInfo[];
  recommendations: string[];
}

export function PerformanceDashboard({ 
  performanceMetrics, 
  indexAnalysis, 
  queryPerformance, 
  recommendations 
}: PerformanceDashboardProps) {
  
  const performanceRadarData = useMemo(() => {
    if (!performanceMetrics) return [];
    return [
      {
        metric: "Índices",
        value: performanceMetrics.indexEfficiency,
        fullMark: 100
      },
      {
        metric: "Queries",
        value: performanceMetrics.queryPerformanceScore,
        fullMark: 100
      },
      {
        metric: "Fragmentação",
        value: performanceMetrics.fragmentationScore,
        fullMark: 100
      },
      {
        metric: "Memória",
        value: performanceMetrics.memoryUsageScore,
        fullMark: 100
      }
    ];
  }, [performanceMetrics]);

  const indexEfficiencyData = useMemo(() => {
    const efficiency = indexAnalysis.reduce((acc, index) => {
      acc[index.efficiency] = (acc[index.efficiency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: "Alta", value: efficiency.HIGH || 0, color: "#10b981" },
      { name: "Média", value: efficiency.MEDIUM || 0, color: "#f59e0b" },
      { name: "Baixa", value: efficiency.LOW || 0, color: "#ef4444" },
      { name: "Não Usada", value: efficiency.UNUSED || 0, color: "#6b7280" }
    ];
  }, [indexAnalysis]);

  const queryPerformanceData = useMemo(() => {
    const performance = queryPerformance.reduce((acc, query) => {
      acc[query.performanceClass] = (acc[query.performanceClass] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: "Rápida", value: performance.FAST || 0, color: "#10b981" },
      { name: "Média", value: performance.MEDIUM || 0, color: "#f59e0b" },
      { name: "Lenta", value: performance.SLOW || 0, color: "#ef4444" },
      { name: "Crítica", value: performance.CRITICAL || 0, color: "#7c2d12" }
    ];
  }, [queryPerformance]);

  const topSlowQueries = useMemo(() => {
    return queryPerformance
      .filter(q => q.performanceClass === 'SLOW' || q.performanceClass === 'CRITICAL')
      .sort((a, b) => b.avgExecutionTime - a.avgExecutionTime)
      .slice(0, 5);
  }, [queryPerformance]);

  const fragmentedIndexes = useMemo(() => {
    return indexAnalysis
      .filter(idx => idx.fragmentationPercent > 30)
      .sort((a, b) => b.fragmentationPercent - a.fragmentationPercent)
      .slice(0, 5);
  }, [indexAnalysis]);

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    if (score >= 20) return 'Crítico';
    return 'Muito Crítico';
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  if (!performanceMetrics) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Análise de performance não disponível</p>
          <p className="text-xs mt-2">Conecte-se ao banco para ver análise completa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Score Geral de Performance */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6" />
            PONTUAÇÃO DE PERFORMANCE
          </CardTitle>
          <div className={`text-4xl font-bold ${getPerformanceColor(performanceMetrics.overallPerformanceScore)}`}>
            {performanceMetrics.overallPerformanceScore}/100
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Badge className={`${getPerformanceColor(performanceMetrics.overallPerformanceScore)} bg-opacity-10 border-0`}>
              {getPerformanceLabel(performanceMetrics.overallPerformanceScore)}
            </Badge>
            {performanceMetrics.overallPerformanceScore < 60 && (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${getPerformanceColor(performanceMetrics.indexEfficiency)}`}>
                {performanceMetrics.indexEfficiency}
              </div>
              <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <Database className="w-3 h-3" />
                Eficiência Índices
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${getPerformanceColor(performanceMetrics.queryPerformanceScore)}`}>
                {performanceMetrics.queryPerformanceScore}
              </div>
              <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Queries
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${getPerformanceColor(performanceMetrics.fragmentationScore)}`}>
                {performanceMetrics.fragmentationScore}
              </div>
              <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <TrendingDown className="w-3 h-3" />
                Fragmentação
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${getPerformanceColor(performanceMetrics.memoryUsageScore)}`}>
                {performanceMetrics.memoryUsageScore}
              </div>
              <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <Activity className="w-3 h-3" />
                Memória
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Tempo Médio Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatExecutionTime(performanceMetrics.avgQueryTime)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Máximo: {formatExecutionTime(performanceMetrics.maxQueryTime)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Queries Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {performanceMetrics.totalQueries - performanceMetrics.slowQueries}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              de {performanceMetrics.totalQueries} total
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Índices Fragmentados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {performanceMetrics.fragmentedIndexes}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {performanceMetrics.unusedIndexes} não utilizados
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Índices Faltando
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {performanceMetrics.missingIndexes}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Oportunidades de otimização
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Eficiência dos Índices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Eficiência dos Índices ({indexAnalysis.length} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={indexEfficiencyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {indexEfficiencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance das Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance das Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={queryPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Índices Mais Fragmentados */}
      {fragmentedIndexes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              Índices com Alta Fragmentação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fragmentedIndexes.map((index, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {index.tableName}.{index.indexName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {index.indexType} • {index.pageCount} páginas • {index.sizeMB.toFixed(1)}MB
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      {index.fragmentationPercent.toFixed(1)}%
                    </Badge>
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      {index.efficiency}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queries Mais Lentas */}
      {topSlowQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              Queries Mais Lentas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSlowQueries.map((query, idx) => (
                <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={
                      query.performanceClass === 'CRITICAL' 
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-orange-100 text-orange-800 border-orange-200'
                    }>
                      {query.performanceClass}
                    </Badge>
                    <div className="text-sm font-medium text-red-700">
                      {formatExecutionTime(query.avgExecutionTime)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mb-2 font-mono bg-gray-100 p-2 rounded overflow-hidden">
                    {query.queryText.substring(0, 200)}
                    {query.queryText.length > 200 && '...'}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Execuções: {query.executionCount.toLocaleString()}</span>
                    <span>CPU: {formatExecutionTime(query.avgCpuTime)}</span>
                    <span>Reads: {query.avgLogicalReads.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendações de Performance */}
      {recommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Wrench className="w-5 h-5" />
              Recomendações de Otimização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-white rounded-lg border border-blue-200">
                  <Settings className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-blue-800">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}