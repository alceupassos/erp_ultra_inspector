import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { inspectSqlServer } from "@/lib/sqlInspector";

async function createPool(server: string, port: number, user: string, password: string, database: string) {
  const config: sql.config = {
    server,
    port,
    user,
    password,
    database,
    options: { encrypt: false, trustServerCertificate: true },
    connectionTimeout: 15000,
    requestTimeout: 15000,
    pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
  };
  return await sql.connect(config);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let pool: sql.ConnectionPool | null = null;
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

    pool = await createPool(server, port, user, password, database);
    const analysis = await inspectSqlServer({ server, port, user, password, database });

    // Identificar tabelas isoladas (sem FKs)
    const isolatedTables = analysis.tables
      .filter((t) => t.foreignKeys.length === 0 && t.primaryKey.length > 0)
      .map((t) => ({
        schema: t.schema,
        name: t.name,
        rowCount: t.rowCount
      }));

    // Construir grafo de relacionamentos
    const relationships = analysis.tables.flatMap((t) =>
      t.foreignKeys.map((fk) => ({
        from: `${t.schema}.${t.name}`,
        to: fk.referenced_table,
        fkName: fk.fk_name
      }))
    );

    // Identificar cadeias de dependências
    const dependencyChains: string[][] = [];
    const visited = new Set<string>();

    function buildChain(table: string, chain: string[]): void {
      if (visited.has(table) || chain.includes(table)) return;
      visited.add(table);
      chain.push(table);

      const outgoing = relationships.filter((r) => r.from === table);
      if (outgoing.length === 0) {
        if (chain.length > 1) dependencyChains.push([...chain]);
      } else {
        outgoing.forEach((rel) => buildChain(rel.to, chain));
      }
      chain.pop();
    }

    analysis.tables.forEach((t) => {
      const tableName = `${t.schema}.${t.name}`;
      if (!visited.has(tableName)) {
        buildChain(tableName, []);
      }
    });

    // Identificar tabelas fact e dimension
    const factTables = analysis.tables
      .filter((t) => {
        const hasManyFks = t.foreignKeys.length >= 3;
        const hasLargeRowCount = t.rowCount > 1000;
        const nameIndicators = /fato|fact|venda|pedido|moviment|transac/i.test(t.name);
        return hasManyFks && (hasLargeRowCount || nameIndicators);
      })
      .map((t) => ({
        schema: t.schema,
        name: t.name,
        rowCount: t.rowCount,
        foreignKeys: t.foreignKeys.length,
        confidence: "HIGH"
      }));

    const dimensionTables = analysis.tables
      .filter((t) => {
        const hasFewFks = t.foreignKeys.length <= 2;
        const hasSmallRowCount = t.rowCount < 100000;
        const nameIndicators = /dim|dimensao|cliente|produto|fornecedor|categoria/i.test(t.name);
        return hasFewFks && (hasSmallRowCount || nameIndicators);
      })
      .map((t) => ({
        schema: t.schema,
        name: t.name,
        rowCount: t.rowCount,
        foreignKeys: t.foreignKeys.length,
        confidence: "MEDIUM"
      }));

    const report = {
      relationships,
      isolatedTables,
      dependencyChains: dependencyChains.slice(0, 20), // Limitar a 20 cadeias
      factTables,
      dimensionTables,
      statistics: {
        totalRelationships: relationships.length,
        isolatedTablesCount: isolatedTables.length,
        factTablesCount: factTables.length,
        dimensionTablesCount: dimensionTables.length,
        maxChainLength: Math.max(...dependencyChains.map((c) => c.length), 0)
      },
      database: analysis.database,
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Erro ao gerar relatório:", error);
    return NextResponse.json(
      { error: "Falha ao gerar relatório", details: error?.message ?? String(error) },
      { status: 500 }
    );
  } finally {
    if (pool) {
      try {
        pool.close();
      } catch (e) {
        console.warn("Erro ao fechar pool:", e);
      }
    }
  }
}

