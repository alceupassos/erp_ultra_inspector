"use client";
import { useSession, signOut } from "next-auth/react";

export default function GlobalLogout() {
  const { status } = useSession();
  if (status !== "authenticated") return null;
  return (
    <button
      onClick={() => signOut()}
      className="fixed top-3 right-3 z-50 px-3 py-2 rounded glow-border bg-primary/20 text-[#ff8a1f] hover:bg-primary/30"
    >
      Sair
    </button>
  );
}