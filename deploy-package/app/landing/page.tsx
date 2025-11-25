"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function Landing() {
  const { data: session, status } = useSession();
  const loggedIn = status === "authenticated";
  const [code, setCode] = useState("");
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold glow-orange">Angra DB Manager</h1>
        {loggedIn ? (
          <button onClick={() => signOut()} className="px-3 py-2 rounded glow-border bg-primary/20 text-[#ff8a1f]">Sair</button>
        ) : (
          <div className="flex items-center gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código TOTP" className="rounded-xl bg-transparent border border-white/10 px-3 py-2" />
            <button onClick={() => signIn("credentials", { code })} className="px-3 py-2 rounded glow-border bg-primary text-primary-foreground">Entrar</button>
          </div>
        )}
      </div>
      {!loggedIn ? (
        <div className="text-sm text-muted-foreground">Faça login para acessar as ferramentas.</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/ultra-conexao" className="neu-card rounded-2xl p-6 glow-border">
            <div className="text-sm font-semibold glow-orange">Conexão ULTRA</div>
            <div className="text-xs text-muted-foreground mt-2">Análise do ERP ULTRA (segurança e performance)</div>
          </Link>
          <Link href="/testar-login" className="neu-card rounded-2xl p-6 glow-border">
            <div className="text-sm font-semibold glow-orange">Testar login</div>
            <div className="text-xs text-muted-foreground mt-2">Teste de porta e SELECT 1</div>
          </Link>
          <Link href="/cepalab" className="neu-card rounded-2xl p-6 glow-border">
            <div className="text-sm font-semibold glow-orange">Sistema CEPALAB (SGQ)</div>
            <div className="text-xs text-muted-foreground mt-2">Explorar views/tabelas e metadados</div>
          </Link>
        </div>
      )}
    </div>
  );
}