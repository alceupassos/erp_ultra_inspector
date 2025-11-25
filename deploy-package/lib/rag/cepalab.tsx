"use client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Search, Link as LinkIcon } from "lucide-react";

type RagChunk = {
  id: string;
  title: string;
  source: string;
  citation: string;
  content: string;
  keywords: string[];
};

const KB: RagChunk[] = [
  {
    id: "site-home",
    title: "Sobre a CEPALAB",
    source: "https://cepalab.com.br/",
    citation: "[Home - Cepalab](https://cepalab.com.br/)",
    content:
      "Empresa com mais de 20 anos no mercado, alta precisão diagnóstica, rede nacional de distribuição e inovação em produtos para saúde. Linhas: Diabetes care, autotestes, materiais e laboratorial.",
    keywords: [
      "inovação",
      "diagnóstica",
      "autotestes",
      "diabetes",
      "rede nacional",
      "qualidade"
    ]
  },
  {
    id: "cnpj-oficial",
    title: "Cadastro CNPJ e CNAE",
    source: "https://portaldatransparencia.gov.br/contratos/667938320/pessoa-juridica/02248312000144",
    citation:
      "[Portal da Transparência - CEPALAB LABORATORIOS S.A](https://portaldatransparencia.gov.br/contratos/667938320/pessoa-juridica/02248312000144)",
    content:
      "CNPJ 02.248.312/0001-44, abertura em 23/10/1997, sede em São José da Lapa/MG. CNAE principal: 46451 (Comércio atacadista de instrumentos e materiais médico-hospitalares).",
    keywords: [
      "CNPJ",
      "CNAE",
      "São José da Lapa",
      "comércio atacadista",
      "materiais médicos"
    ]
  },
  {
    id: "fav-recursos",
    title: "Relação com Governo Federal",
    source: "https://portaldatransparencia.gov.br/",
    citation:
      "[Portal da Transparência - Panorama](https://portaldatransparencia.gov.br/contratos/667938320/pessoa-juridica/02248312000144)",
    content:
      "Favorecido de recursos do Governo Federal com valores recebidos superiores a R$ 81,8 milhões (histórico).",
    keywords: ["governo", "recursos", "contratos", "favorecido"]
  },
  {
    id: "econodata",
    title: "Dados cadastrais e atividades",
    source: "https://www.econodata.com.br/consulta-empresa/02248312000144-CEPALAB-LABORATORIOS-SA",
    citation:
      "[Econodata - Consulta Empresa](https://www.econodata.com.br/consulta-empresa/02248312000144-CEPALAB-LABORATORIOS-SA)",
    content:
      "Razão social: CEPALAB LABORATORIOS S.A, fundada em 23/10/1997. Atividades incluem comércio atacadista de materiais médico-hospitalares e fabricação de preparações farmacêuticas.",
    keywords: ["fundação", "razão social", "fabricação", "atacadista"]
  },
  {
    id: "reclameaqui",
    title: "Reputação e atendimento",
    source: "https://www.reclameaqui.com.br/empresa/cepalab-laboratorio/",
    citation:
      "[Reclame Aqui - Cepalab](https://www.reclameaqui.com.br/empresa/cepalab-laboratorio/)",
    content:
      "Página de reputação sem selo verificado e sem reputação definida por volume de reclamações insuficiente em períodos recentes.",
    keywords: ["reputação", "atendimento", "reclamações"]
  }
];

function tokenize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9\sáéíóúãõâêîôûç]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function score(queryTokens: string[], chunk: RagChunk) {
  const chunkTokens = new Set([
    ...tokenize(chunk.title),
    ...tokenize(chunk.content),
    ...chunk.keywords.map((k) => k.toLowerCase())
  ]);
  let hits = 0;
  for (const t of queryTokens) if (chunkTokens.has(t)) hits++;
  const density = hits / Math.max(1, chunkTokens.size);
  return hits + density;
}

export function queryCepalabRAG(query: string, k = 4) {
  const q = tokenize(query);
  return KB
    .map((c) => ({ c, s: score(q, c) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map(({ c }) => c);
}

export function buildCepalabReportSection(query: string) {
  const results = queryCepalabRAG(query);
  const bullets = results
    .map(
      (r) => `- ${r.title}: ${r.content} (Fonte: ${r.citation})`
    )
    .join("\n");
  return `## Contexto da Empresa CEPALAB (RAG)\n\nConsulta: ${query}\n\n${bullets}`;
}

export function RagCepalabSection() {
  const [query, setQuery] = useState("panorama e dados oficiais CEPALAB");
  const results = useMemo(() => queryCepalabRAG(query), [query]);
  const markdown = useMemo(() => buildCepalabReportSection(query), [query]);

  const copy = async () => {
    await navigator.clipboard.writeText(markdown);
  };

  return (
    <Card className="neu-card mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 glow-orange">
          <Database className="w-4 h-4" /> RAG Profundo: CEPALAB
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 glow-orange" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl bg-transparent border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Pergunte sobre CEPALAB (ex.: CNAE, CNPJ, linhas de produto, reputação)"
            />
            <Button onClick={copy} className="ml-2">Copiar seção</Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {results.map((r) => (
              <Card key={r.id} className="neu-card">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm glow-orange">{r.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{r.content}</p>
                  <a
                    href={r.source}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-[#ff8a1f]"
                  >
                    <LinkIcon className="w-3 h-3" /> Fonte
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}