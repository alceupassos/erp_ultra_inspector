import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const server = searchParams.get("server") || "104.234.224.238";
    const port = Number(searchParams.get("port")) || 1445;
    const user = searchParams.get("user") || "angrax";
    const password = searchParams.get("password") || "";
    const database = searchParams.get("database") || "sgc";

    if (!password) {
      return NextResponse.json({ error: "password é obrigatório" }, { status: 400 });
    }

    const baseUrl = req.nextUrl.origin;
    const queryParams = new URLSearchParams({
      server,
      port: port.toString(),
      user,
      password,
      database
    });

    // Buscar todos os relatórios
    const [
      structureOverview,
      relationships,
      schemasAnalysis,
      sensitiveData,
      userPermissions,
      securityConfig,
      indexAnalysis,
      queryPerformance,
      resourceUsage,
      dataQuality,
      dataPatterns,
      executiveDashboard
    ] = await Promise.all([
      fetch(`${baseUrl}/api/reports/structure-overview?${queryParams}`).then((r) => r.json()),
      fetch(`${baseUrl}/api/reports/relationships?${queryParams}`).then((r) => r.json()),
      fetch(`${baseUrl}/api/reports/schemas-analysis?${queryParams}`).then((r) => r.json()),
      fetch(`${baseUrl}/api/reports/sensitive-data?${queryParams}`).then((r) => r.json()),
      fetch(`${baseUrl}/api/reports/user-permissions?${queryParams}`).then((r) => r.json()),
      fetch(`${baseUrl}/api/reports/security-config?${queryParams}`).then((r) => r.json()),
      fetch(`${baseUrl}/api/reports/index-analysis?${queryParams}`).then((r) => r.json()),
      fetch(`${baseUrl}/api/reports/query-performance?${queryParams}`).then((r) => r.json()),
      fetch(`${baseUrl}/api/reports/resource-usage?${queryParams}`).then((r) => r.json()),
      fetch(`${baseUrl}/api/reports/data-quality?${queryParams}`).then((r) => r.json()),
      fetch(`${baseUrl}/api/reports/data-patterns?${queryParams}`).then((r) => r.json()),
      fetch(`${baseUrl}/api/reports/executive-dashboard?${queryParams}`).then((r) => r.json())
    ]);

    const fullReport = {
      metadata: {
        database,
        server,
        port,
        generatedAt: new Date().toISOString(),
        reportVersion: "1.0"
      },
      executiveSummary: executiveDashboard,
      structure: {
        overview: structureOverview,
        relationships,
        schemasAnalysis
      },
      security: {
        sensitiveData,
        userPermissions,
        securityConfig
      },
      performance: {
        indexAnalysis,
        queryPerformance,
        resourceUsage
      },
      dataQuality: {
        quality: dataQuality,
        patterns: dataPatterns
      }
    };

    return NextResponse.json(fullReport);
  } catch (error: any) {
    console.error("Erro ao gerar relatório completo:", error);
    return NextResponse.json(
      { error: "Falha ao gerar relatório completo", details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}

