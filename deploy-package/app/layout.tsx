import "./globals.css";
import type { ReactNode } from "react";
import Providers from "@/components/Providers";
import GlobalLogout from "@/components/auth/GlobalLogout";

export const metadata = {
  title: "ERP ULTRA Inspector",
  description: "Explorador gráfico de banco SQL Server (ERP ULTRA)"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          <GlobalLogout />
          {children}
        </Providers>
      </body>
    </html>
  );
}
