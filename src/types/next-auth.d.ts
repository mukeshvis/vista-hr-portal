import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      acc_type: string
      company_id: string
      emp_id: string | null
      username: string
      user_level: number | string | undefined
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    acc_type: string
    company_id: string
    emp_id: string | null
    username: string
    user_level: number | string | undefined
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    acc_type: string
    company_id: string
    emp_id: string | null
    username: string
    user_level: number | string | undefined
  }
}