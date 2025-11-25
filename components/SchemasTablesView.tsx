"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Database, Table, Eye, ChevronRight, ChevronDown } from "lucide-react";

type SchemaData = {
  schemas: Array<{
    schemaName: string;
    tables: Array<{
      tableName: string;
      rowCount: number;
    }>;
    views: Array<{
      viewName: string;
    }>;
  }>;
  summary: {
    totalSchemas: number;
    totalTables: number;
    totalViews: number;
    totalRows: number;
  };
};

type Props = {
  data: SchemaData | null;
  loading?: boolean;
};

export function SchemasTablesView({ data, loading }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set());

  const filteredData = useMemo(() => {
    if (!data) return null;

    const term = searchTerm.toLowerCase();
    if (!term) return data;

    return {
      ...data,
      schemas: data.schemas.filter(
        (schema) =>
          schema.schemaName.toLowerCase().includes(term) ||
          schema.tables.some((t) => t.tableName.toLowerCase().includes(term)) ||
          schema.views.some((v) => v.viewName.toLowerCase().includes(term))
      ),
    };
  }, [data, searchTerm]);

  const toggleSchema = (schemaName: string) => {
    const newExpanded = new Set(expandedSchemas);
    if (newExpanded.has(schemaName)) {
      newExpanded.delete(schemaName);
    } else {
      newExpanded.add(schemaName);
    }
    setExpandedSchemas(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground glow-orange-subtle">Carregando schemas e tabelas...</p>
        </div>
      </div>
    );
  }

  if (!data || !filteredData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground glow-orange-subtle">
            Nenhum dado de schema disponível. Execute uma análise primeiro.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="neu-card neu-hover">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Schemas</div>
            <div className="text-2xl font-bold glow-orange">{filteredData.summary.totalSchemas}</div>
          </CardContent>
        </Card>
        <Card className="neu-card neu-hover">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Tabelas</div>
            <div className="text-2xl font-bold glow-orange">{filteredData.summary.totalTables}</div>
          </CardContent>
        </Card>
        <Card className="neu-card neu-hover">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Views</div>
            <div className="text-2xl font-bold glow-orange">{filteredData.summary.totalViews}</div>
          </CardContent>
        </Card>
        <Card className="neu-card neu-hover">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total de Linhas</div>
            <div className="text-2xl font-bold glow-orange">
              {filteredData.summary.totalRows.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card className="neu-card neu-hover">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por schema, tabela ou view..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-black/30 border-primary/20 glow-orange-subtle"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Schemas */}
      <div className="space-y-3">
        {filteredData.schemas.map((schema) => {
          const isExpanded = expandedSchemas.has(schema.schemaName);
          return (
            <Card key={schema.schemaName} className="neu-card neu-hover">
              <CardHeader className="p-4 pb-2">
                <button
                  onClick={() => toggleSchema(schema.schemaName)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-primary" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-primary" />
                    )}
                    <Database className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-bold glow-orange">{schema.schemaName}</CardTitle>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {schema.tables.length} tabelas
                    </Badge>
                    {schema.views.length > 0 && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        {schema.views.length} views
                      </Badge>
                    )}
                  </div>
                </button>
              </CardHeader>
              {isExpanded && (
                <CardContent className="p-4 pt-2">
                  {/* Tabelas */}
                  {schema.tables.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                        <Table className="h-3 w-3" />
                        Tabelas ({schema.tables.length})
                      </div>
                      <div className="space-y-1">
                        {schema.tables.map((table) => (
                          <div
                            key={table.tableName}
                            className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-primary/10 hover:border-primary/30 transition-all"
                          >
                            <span className="text-xs font-mono text-primary glow-orange-subtle">
                              {table.tableName}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {table.rowCount.toLocaleString("pt-BR")} linhas
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Views */}
                  {schema.views.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Views ({schema.views.length})
                      </div>
                      <div className="space-y-1">
                        {schema.views.map((view) => (
                          <div
                            key={view.viewName}
                            className="flex items-center p-2 rounded-lg bg-black/20 border border-primary/10 hover:border-primary/30 transition-all"
                          >
                            <span className="text-xs font-mono text-primary glow-orange-subtle">
                              {view.viewName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {filteredData.schemas.length === 0 && (
        <Card className="neu-card neu-hover">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground glow-orange-subtle">
              Nenhum resultado encontrado para &quot;{searchTerm}&quot;
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

