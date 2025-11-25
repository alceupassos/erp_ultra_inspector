# CEPALAB — Guia de Frontend, Paleta de Cores e Dependências

## Paleta de Cores

```css
:root {
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  --primary-800: #1e40af;
  --primary-900: #1e3a8a;

  --success-500: #10b981;
  --warning-500: #f59e0b;
  --danger-500: #ef4444;
  --purple-500: #6366f1;

  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
}
```

- Primárias: `--primary-500` para ações e `--primary-600` para hover
- Feedback: `--success-500`, `--warning-500`, `--danger-500`
- Neutras: escala `--gray-*` para textos, bordas e fundos
- Gradientes: `from-primary-500 to-primary-700`, `from-gray-50 to-white`

## Tipografia

- Fonte: Inter, ui-sans-serif, system-ui
- Tamanhos: `text-xs` `text-sm` `text-base` `text-lg` `text-xl` `text-2xl` `text-3xl`
- Peso: `font-normal` `font-medium` `font-semibold` `font-bold`
- Cor de texto: `text-gray-900` primário, `text-gray-600` secundário

## Espaçamento e Layout

- Espaços: `gap-2` `gap-4` `gap-6` `gap-8`
- Padding: `p-2` `p-4` `p-6`
- Bordas: `rounded-lg` `rounded-xl` `rounded-2xl`
- Sombras: `shadow-sm` `shadow` `shadow-lg`
- Breakpoints: `sm` `md` `lg` `xl` `2xl`

## Componentes UI (shadcn/ui)

- Base: `button` `card` `input` `label` `textarea` `badge`
- Layout: `Sidebar` `Topbar`
- Tabelas e Listas: usar classes utilitárias Tailwind com `table` e semântica
- Utilitários: `components/ui/utils.ts` para composição de classes

## Gráficos (Recharts)

- Tipos: `LineChart` `BarChart` `PieChart` `RadarChart`
- Cores padrão: `#3b82f6` `#10b981` `#f59e0b` `#ef4444` `#6366f1`
- Práticas: eixos legíveis, tooltips, legendas, animação inicial suave

## Ícones (lucide-react)

- Conjunto: `DollarSign` `Users` `Package` `TrendingUp`
- Tamanho: `className="h-4 w-4"`
- Cor: `text-primary-500` `text-gray-500`

## Animações (framer-motion)

- Entrada: `initial={{ opacity: 0, y: 20 }}` `animate={{ opacity: 1, y: 0 }}`
- Hover: `whileHover={{ scale: 1.02 }}`
- Duração: `transition={{ duration: 0.5 }}`

## Acessibilidade

- Foco: `focus:outline-none focus:ring-2 focus:ring-primary-500`
- Contraste: usar escala `--gray-*` e cores de feedback
- Semântica: `button` `nav` `header` `table` `thead` `tbody`

## Tematização

- Dark mode: classe `dark` com `bg-gray-900 text-gray-100`
- Tokens: usar variáveis CSS com Tailwind via `theme.extend.colors`

## Estrutura de Pastas Sugerida

```
src/
├─ components/
│  ├─ cepalab/
│  ├─ charts/
│  ├─ ui/
│  └─ layout/
├─ app/
│  ├─ api/
│  └─ cepalab/
├─ lib/
└─ types/
```

## Dependências do Frontend

- Núcleo: `next` `react` `react-dom`
- Estilo: `tailwindcss` `postcss` `autoprefixer`
- Utilitários: `clsx` `tailwind-merge`
- UI: `lucide-react` `framer-motion`
- Gráficos: `recharts`
- Auth opcional: `next-auth`
- IA opcional: `openai`

## Instalação

```bash
npm install next react react-dom tailwindcss postcss autoprefixer clsx tailwind-merge lucide-react framer-motion recharts
```

## Configuração Tailwind

```ts
// tailwind.config.ts
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        success: { 500: "#10b981" },
        warning: { 500: "#f59e0b" },
        danger: { 500: "#ef4444" },
        purple: { 500: "#6366f1" },
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        DEFAULT: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
        lg: "0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
};
```

## Exemplos

```tsx
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricCard({ title, value }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="border-l-4 border-primary-500">
        <CardHeader>
          <CardTitle className="text-sm text-gray-600">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

```tsx
import { LineChart, Line } from "recharts";

export function VendasChart() {
  const data = [
    { mes: "Jan", vendas: 45000 },
    { mes: "Fev", vendas: 52000 },
    { mes: "Mar", vendas: 48000 },
  ];
  return (
    <LineChart data={data} width={600} height={300}>
      <Line type="monotone" dataKey="vendas" stroke="#3b82f6" strokeWidth={2} />
    </LineChart>
  );
}
```

```tsx
import { Button } from "@/components/ui/button";

export function PrimaryButton() {
  return <Button className="bg-primary-600 hover:bg-primary-700 text-white">Ação</Button>;
}
```