import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/database/prisma"
import { validateUserCredentials } from "@/lib/database/queries/user"

export const authConfig = {
  // adapter: PrismaAdapter(prisma), // Comment out for credentials provider
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        console.log('🔍 Attempting login for:', credentials.username)

        const user = await validateUserCredentials(
          credentials.username as string,
          credentials.password as string
        )

        if (!user) {
          console.log('❌ User not found or invalid credentials for:', credentials.username)
          return null
        }

        console.log('✅ User authenticated:', user.username)

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name || user.username,
          username: user.username,
          role: user.role_no,
          acc_type: user.acc_type,
          company_id: user.company_id.toString(),
          emp_id: user.emp_id,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Allow sign in if user exists and is active
      if (user && account?.provider === "credentials") {
        return true
      }
      return false
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === "credentials") {
        token.role = user.role
        token.acc_type = user.acc_type
        token.company_id = user.company_id
        token.emp_id = user.emp_id
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.acc_type = token.acc_type as string
        session.user.company_id = token.company_id as string
        session.user.emp_id = token.emp_id as string
        session.user.username = token.username as string
      }
      return session
    }
  },
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig