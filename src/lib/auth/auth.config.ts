import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

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
        console.log('🔐 [AUTH CONFIG] authorize callback - Starting authentication')

        if (!credentials?.username || !credentials?.password) {
          console.log('❌ [AUTH CONFIG] Missing credentials')
          return null
        }

        console.log('🔍 [AUTH CONFIG] Attempting login for:', credentials.username)

        // Import dynamically to avoid Edge Runtime issues
        const { validateUserCredentials } = await import("@/lib/database/queries/user")

        const user = await validateUserCredentials(
          credentials.username as string,
          credentials.password as string
        )

        if (!user) {
          console.log('❌ [AUTH CONFIG] User not found or invalid credentials for:', credentials.username)
          return null
        }

        console.log('✅ [AUTH CONFIG] User authenticated:', user.username, '| User level:', user.user_level)

        const authUser = {
          id: user.id.toString(),
          email: user.email,
          name: user.name || user.username,
          username: user.username,
          role: user.role_no,
          acc_type: user.acc_type,
          company_id: user.company_id.toString(),
          emp_id: user.emp_id,
          user_level: user.user_level,
        }

        console.log('✅ [AUTH CONFIG] Returning auth user:', authUser.username)
        return authUser
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
      console.log('🔐 [AUTH CONFIG] signIn callback - User:', user?.username, '| Provider:', account?.provider)
      // Allow sign in if user exists and is active
      if (user && account?.provider === "credentials") {
        console.log('✅ [AUTH CONFIG] Sign in allowed for user:', user.username)
        return true
      }
      console.log('❌ [AUTH CONFIG] Sign in denied')
      return false
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === "credentials") {
        console.log('🔐 [AUTH CONFIG] JWT callback - Adding user data to token for:', user.username, '| user_level:', user.user_level, '| Type:', typeof user.user_level)
        token.role = user.role
        token.acc_type = user.acc_type
        token.company_id = user.company_id
        token.emp_id = user.emp_id
        token.username = user.username
        token.user_level = user.user_level
        console.log('🔐 [AUTH CONFIG] JWT token data set - user_level in token:', token.user_level)
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        console.log('🔐 [AUTH CONFIG] Session callback - Building session for:', token.username, '| Token user_level:', token.user_level, '| Type:', typeof token.user_level)
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.acc_type = token.acc_type as string
        session.user.company_id = token.company_id as string
        session.user.emp_id = token.emp_id as string
        session.user.username = token.username as string

        // Handle user_level carefully - 0 is a valid level!
        if (typeof token.user_level === 'number') {
          session.user.user_level = token.user_level
        } else if (token.user_level !== null && token.user_level !== undefined) {
          session.user.user_level = Number(token.user_level)
        } else {
          session.user.user_level = 1 // Default only if truly missing
        }

        console.log('🔐 [AUTH CONFIG] Session built - User:', session.user.username, '| Level:', session.user.user_level, '| Type:', typeof session.user.user_level)
      }
      return session
    }
  },
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig