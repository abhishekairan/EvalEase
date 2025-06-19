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
  ],// In your auth.ts file
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
      // Fetch fresh user data from database on every session access
      let freshUserData = null;
      
      if (token.role === "admin") {
        freshUserData = await getAdminForAuth({email: token.email as string});
      } else if (token.role === "jury") {
        freshUserData = await getJuryForAuth({ email: token.email as string});
      }
      
      if (freshUserData) {
        session.user.id = String(freshUserData.id);
        session.user.email = String(freshUserData.email);
        session.user.name = String(freshUserData.name);
        session.user.role = token.role as string;
        
        if (token.role === "jury" && 'session' in freshUserData) {
          (session.user as any).session = String(freshUserData.session);
        }
      }
    }
    return session;
  },
}

});
