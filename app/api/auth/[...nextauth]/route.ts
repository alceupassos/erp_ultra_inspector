import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticator } from "otplib";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Google Authenticator",
      credentials: { code: { label: "Código TOTP", type: "text" } },
      async authorize(credentials) {
        const secret = process.env.TOTP_SECRET || "JBSWY3DPEHPK3PXP";
        const code = credentials?.code as string;
        const valid = authenticator.check(code, secret);
        if (!valid) return null;
        return { id: "totp-user", name: "Usuário TOTP" } as any;
      }
    })
  ],
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: { error: "/auth/error" },
  callbacks: {
    async jwt({ token }) {
      token.name = token.name || "Usuário TOTP";
      return token;
    },
    async session({ session, token }) {
      session.user = { name: token.name as string } as any;
      return session;
    }
  }
});

export { handler as GET, handler as POST };