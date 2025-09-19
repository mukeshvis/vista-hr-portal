import { z } from "zod"

export const signInSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(100, "Username must be less than 100 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(100, "Password must be less than 100 characters"),
})

export type SignInInput = z.infer<typeof signInSchema>