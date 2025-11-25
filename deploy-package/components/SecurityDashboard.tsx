"use client";

import { useMemo } from "react";
import type { SecurityMetrics, SensitiveDataInfo, UserPermissionInfo, AuditConfig } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Users, Database, Eye, Key, AlertCircle } from "lucide-react";
import OraclePanel from "@/components/OraclePanel";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

interface SecurityDashboardProps {
  securityMetrics: SecurityMetrics | null;
  sensitiveData: SensitiveDataInfo[];
  userPermissions: UserPermissionInfo[];
  auditConfig: AuditConfig | null;
}

export function SecurityDashboard({ 
  securityMetrics, 
  sensitiveData, 
  userPermissions, 
  auditConfig 
}: SecurityDashboardProps) {
  
  const securityRadarData = useMemo(() => {
    if (!securityMetrics) return [];
    return [
      {
        metric: "Dados Sensíveis",
        value: securityMetrics.sensitiveDataScore,
        fullMark: 100
      },
      {
        metric: "Acesso Usuários",
        value: securityMetrics.userAccessScore,
        fullMark: 100
      },
      {
        metric: "Configuração",
        value: securityMetrics.securityConfigurationScore,
        fullMark: 100
      },
      {
        metric: "Criptografia",
        value: securityMetrics.encryptionScore,
        fullMark: 100
      }
    ];
  }, [securityMetrics]);

  const sensitiveDataByType = useMemo(() => {
    const grouped = sensitiveData.reduce((acc, item) => {
      if (!acc[item.sensitiveType]) {
        acc[item.sensitiveType] = { type: item.sensitiveType, count: 0, risk: item.riskLevel };
      }
      acc[item.sensitiveType].count++;
      return acc;
    }, {} as Record<string, { type: string; count: number; risk: string }>);
    
    return Object.values(grouped).sort((a, b) => b.count - a.count);
  }, [sensitiveData]);

  const userRiskDistribution = useMemo(() => {
    const lowRisk = userPermissions.filter(u => u.riskScore <= 5).length;
    const mediumRisk = userPermissions.filter(u => u.riskScore > 5 && u.riskScore <= 10).length;
    const highRisk = userPermissions.filter(u => u.riskScore > 10 && u.riskScore <= 20).length;
    const criticalRisk = userPermissions.filter(u => u.riskScore > 20).length;

    return [
      { name: "Baixo Risco", value: lowRisk, color: "#10b981" },
      { name: "Médio Risco", value: mediumRisk, color: "#f59e0b" },
      { name: "Alto Risco", value: highRisk, color: "#ef4444" },
      { name: "Crítico", value: criticalRisk, color: "#7c2d12" }
    ];
  }, [userPermissions]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSecurityScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    if (score >= 20) return 'Crítico';
    return 'Muito Crítico';
  };

  if (!securityMetrics) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Análise de segurança não disponível</p>
          <p className="text-xs mt-2">Conecte-se ao banco para ver análise completa</p>
        </div>
      </div>
    );
  }

  const overallScore = Math.round(
    (securityMetrics.sensitiveDataScore + 
     securityMetrics.userAccessScore + 
     securityMetrics.securityConfigurationScore + 
     securityMetrics.encryptionScore) / 4
  );

  return (
    <div className="space-y-6">
      <OraclePanel
        area="sgq"
        filters={{}}
        kpis={{ overallSecurityScore: overallScore, encryptionScore: securityMetrics.encryptionScore }}
        sampleRows={[]}
        metadata={{ sensitiveColumns: sensitiveData.length, users: userPermissions.length }}
      />
      {/* Score Geral de Segurança */}
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">PONTUAÇÃO DE SEGURANÇA</CardTitle>
          <div className={`text-4xl font-bold ${getSecurityScoreColor(overallScore)}`}>
            {overallScore}/100
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge className={`${getSecurityScoreColor(overallScore)} bg-opacity-10 border-0`}>
              {getSecurityScoreLabel(overallScore)}
            </Badge>
            {overallScore < 60 && (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
          </div>
          
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getSecurityScoreColor(securityMetrics.sensitiveDataScore)}`}>
                {securityMetrics.sensitiveDataScore}
              </div>
              <div className="text-xs text-gray-500">Dados Sensíveis</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getSecurityScoreColor(securityMetrics.userAccessScore)}`}>
                {securityMetrics.userAccessScore}
              </div>
              <div className="text-xs text-gray-500">Acesso Usuários</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getSecurityScoreColor(securityMetrics.securityConfigurationScore)}`}>
                {securityMetrics.securityConfigurationScore}
              </div>
              <div className="text-xs text-gray-500">Configuração</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getSecurityScoreColor(securityMetrics.encryptionScore)}`}>
                {securityMetrics.encryptionScore}
              </div>
              <div className="text-xs text-gray-500">Criptografia</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Radar de Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Análise de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={securityRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Pontuação"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Risco de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Risco de Usuários ({userPermissions.length} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userRiskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userRiskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Dados Sensíveis por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Dados Sensíveis Detectados ({sensitiveData.length} colunas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sensitiveDataByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {sensitiveData.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-mono">
                      {item.tableName}.{item.columnName}
                    </span>
                  </div>
                  <Badge className={getRiskColor(item.riskLevel)}>
                    {item.sensitiveType}
                  </Badge>
                </div>
              ))}
              {sensitiveData.length > 10 && (
                <p className="text-xs text-gray-500 text-center">
                  ... e mais {sensitiveData.length - 10} colunas
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuração de Auditoria */}
      {auditConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Configuração de Auditoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold">Auditoria do Servidor</div>
                  <div className="text-sm text-gray-500">SQL Server Audit</div>
                </div>
                <Badge className={auditConfig.serverAuditEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {auditConfig.serverAuditEnabled ? 'Ativado' : 'Desativado'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold">Auditoria do Banco</div>
                  <div className="text-sm text-gray-500">Database Audit</div>
                </div>
                <Badge className={auditConfig.databaseAuditEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {auditConfig.databaseAuditEnabled ? 'Ativado' : 'Desativado'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold">Change Data Capture</div>
                  <div className="text-sm text-gray-500">CDC</div>
                </div>
                <Badge className={auditConfig.cdcEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {auditConfig.cdcEnabled ? 'Ativado' : 'Desativado'}
                </Badge>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-900">Pontuação de Conformidade</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-600">
                {auditConfig.complianceScore}/100
              </div>
              <div className="text-sm text-blue-700">
                {auditConfig.complianceScore >= 80 ? 'Conformidade Alta' : 
                 auditConfig.complianceScore >= 60 ? 'Conformidade Média' : 
                 'Conformidade Baixa - Ações Recomendadas'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas de Segurança */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            Alertas de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {securityMetrics.criticalRiskColumns > 0 && (
              <div className="flex items-center gap-2 p-2 bg-red-100 rounded border-l-4 border-red-500">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">
                  {securityMetrics.criticalRiskColumns} colunas com dados críticos não protegidos
                </span>
              </div>
            )}
            
            {securityMetrics.highRiskUsers > 0 && (
              <div className="flex items-center gap-2 p-2 bg-orange-100 rounded border-l-4 border-orange-500">
                <Users className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-800">
                  {securityMetrics.highRiskUsers} usuários com privilégios excessivos
                </span>
              </div>
            )}
            
            {securityMetrics.dangerousFeaturesEnabled > 0 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-100 rounded border-l-4 border-yellow-500">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  {securityMetrics.dangerousFeaturesEnabled} recursos perigosos habilitados
                </span>
              </div>
            )}
            
            {securityMetrics.encryptionScore === 0 && (
              <div className="flex items-center gap-2 p-2 bg-red-100 rounded border-l-4 border-red-500">
                <Key className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">
                  Criptografia TDE não está habilitada
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}