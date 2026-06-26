import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.universityId = user.universityId
      }
      return token
    },
    session({ session, token }) {
      session.user.role = token.role as string
      session.user.universityId = token.universityId as number
      return session
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user) return null
        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!passwordMatch) return null
        return { id: String(user.id), email: user.email, role: user.role, universityId: user.universityId }
      },
    }),
  ],
})