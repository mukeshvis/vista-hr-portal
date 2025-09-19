"use server"

import { signIn, signOut } from "@/lib/auth/auth"
import { signInSchema } from "@/lib/validations/auth"
import { redirect } from "next/navigation"

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    const result = signInSchema.safeParse({ username, password })

    if (!result.success) {
      return 'Invalid input fields'
    }

    await signIn('credentials', {
      username: result.data.username,
      password: result.data.password,
      redirectTo: '/dashboard',
    })

    return undefined
  } catch (error) {
    // NEXT_REDIRECT is expected when signIn succeeds and redirects
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error // Re-throw to allow the redirect to happen
    }

    console.error('Authentication error:', error)

    if (error instanceof Error && error.message.includes('CredentialsSignin')) {
      return 'Invalid credentials'
    }

    return 'Something went wrong'
  }
}


export async function signOutAction() {
  try {
    await signOut({ redirectTo: '/login' })
  } catch (error) {
    // Handle redirect errors gracefully
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    console.error('Sign out error:', error)
    throw error
  }
}