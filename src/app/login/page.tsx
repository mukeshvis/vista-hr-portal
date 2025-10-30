"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { authenticate } from "@/lib/actions/auth"
import { useActionState, useState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()

  if (pending) {
    console.log('🔄 [LOGIN] Form submitting...')
  }

  return (
    <Button
      className="w-full"
      type="submit"
      disabled={pending}
    >
      {pending ? "Signing in..." : "Sign In"}
    </Button>
  )
}

export default function LoginPage() {
  const [errorMessage, dispatch] = useActionState(authenticate, undefined)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  // Handle successful login
  useEffect(() => {
    if (errorMessage === 'SUCCESS') {
      console.log('✅ [LOGIN] Login successful! Redirecting to dashboard...')
      // Give session time to be set, then redirect
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh() // Force refresh to load session
      }, 100)
    }
  }, [errorMessage, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">VIS HR Portal</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={dispatch} className="space-y-4">
              {/* Username/Email Field */}
              <div>
                <Label htmlFor="username" className="mb-2 block">Username or Email</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username or email"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="password" className="mb-2 block">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && errorMessage !== 'SUCCESS' && (
                <div className="text-red-600 text-sm">
                  {errorMessage}
                </div>
              )}

              {/* Success Message */}
              {errorMessage === 'SUCCESS' && (
                <div className="text-green-600 text-sm font-medium">
                  Login successful! Redirecting to dashboard...
                </div>
              )}

              {/* Submit Button */}
              <SubmitButton />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}