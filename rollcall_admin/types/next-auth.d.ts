import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      role: string
      universityId: number
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    universityId: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    universityId: number
  }
}
