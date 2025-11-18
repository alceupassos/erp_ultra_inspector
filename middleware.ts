export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/ultra-conexao/:path*", "/testar-login/:path*", "/cepalab/:path*"],
};