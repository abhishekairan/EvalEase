// lib/auth-middleware.ts
import NextAuth from "next-auth"

export const { auth } = NextAuth({
  session: { 
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  providers: [], // Empty providers for middleware
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET, // Make sure this is set
});
