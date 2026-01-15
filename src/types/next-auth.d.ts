// types/next-auth.d.ts

declare module "next-auth" {
  interface User {
    id: string
    email: string
    name: string
    role: string
    session?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      session?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name: string
    role: string
    session?: string
  }
}
