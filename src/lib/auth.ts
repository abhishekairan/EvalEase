// lib/auth.ts - FIXED VERSION
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyPassword } from "./password";
import { getAdminForAuth, getJuryForAuth } from "@/db/utils";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials: any) {
        try {
          const { email, password, role } = credentials;

          if (!email || !password || !role) {
            return null;
          }

          let passwordHash = '';

          if (role === "admin") {
            const data = await getAdminForAuth({ email: email });
            if (!data) return null;

            passwordHash = data.password;
            const isValidPassword = await verifyPassword(password, passwordHash);
            if (!isValidPassword) return null;

            return {
              id: String(data.id),
              email: String(data.email),
              name: String(data.name),
              role: 'admin',
            };

          } else if (role === "jury") {
            const data = await getJuryForAuth({ email: email });
            if (!data) return null;

            passwordHash = data.password;
            const isValidPassword = await verifyPassword(password, passwordHash);
            if (!isValidPassword) return null;

            return {
              id: String(data.id),
              email: String(data.email),
              name: String(data.name),
              role: "jury",
              session: String(data.session)
            };
          }

          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }, // FIXED: Added missing closing brace
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        if('session' in user) token.session = user.session;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        if (token.session) {
          (session.user as any).session = token.session as string;
        }
      }
      return session;
    },
  },
});
