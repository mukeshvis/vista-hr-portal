"use server"

import { signIn, signOut } from "@/lib/auth/auth"
import { signInSchema } from "@/lib/validations/auth"

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

    console.log('🔑 [AUTH] Starting sign in for user:', result.data.username)

    try {
      // Sign in without automatic redirect - return result to client
      const response = await signIn('credentials', {
        username: result.data.username,
        password: result.data.password,
        redirect: false,
      })

      console.log('✅ [AUTH] Sign in response:', response)

      // Check if sign in was successful
      if (response?.error) {
        console.error('❌ [AUTH] Sign in failed:', response.error)
        return 'Invalid credentials'
      }

      console.log('✅ [AUTH] Sign in successful! Returning success to client...')
      // Return success - let client handle redirect after session updates
      return 'SUCCESS'
    } catch (signInError) {
      console.error('❌ [AUTH] Sign in error:', signInError)
      throw signInError
    }
  } catch (error) {
    console.error('❌ [AUTH] Authentication error:', error)

    if (error instanceof Error && error.message.includes('CredentialsSignin')) {
      return 'Invalid credentials'
    }

    return 'Something went wrong'
  }
}


export async function signOutAction() {
  await signOut({ redirectTo: '/login' })
}