import { prisma } from "../prisma"
import { users } from "@prisma/client"
import bcrypt from "bcryptjs"

export async function getUserByEmail(email: string): Promise<users | null> {
  try {
    const user = await prisma.users.findFirst({
      where: {
        email,
        status: 1, // Only status 1 is active and allowed to login
      },
    })
    return user
  } catch (error) {
    console.error("Error fetching user by email:", error)
    return null
  }
}

export async function getUserByUsername(username: string): Promise<users | null> {
  try {
    const user = await prisma.users.findFirst({
      where: {
        username,
        status: 1, // Only status 1 is active and allowed to login
      },
    })
    return user
  } catch (error) {
    console.error("Error fetching user by username:", error)
    return null
  }
}

export async function getUserById(id: number): Promise<users | null> {
  try {
    const user = await prisma.users.findUnique({
      where: {
        id,
      },
    })
    return user
  } catch (error) {
    console.error("Error fetching user by id:", error)
    return null
  }
}

export async function validateUserCredentials(
  usernameOrEmail: string,
  password: string
): Promise<users | null> {
  try {
    console.log('🔍 Looking up user:', usernameOrEmail)

    // First find the user by username or email
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ],
        status: 1, // Only status 1 is active and allowed to login
      },
    })

    if (!user) {
      console.log('❌ No active user found with username/email:', usernameOrEmail)

      // Check if user exists but is inactive
      const inactiveUser = await prisma.users.findFirst({
        where: {
          OR: [
            { username: usernameOrEmail },
            { email: usernameOrEmail }
          ],
        },
      })

      if (inactiveUser) {
        console.log('⚠️ User exists but is inactive. Status:', inactiveUser.status, '(Only status 1 can login)')
      }

      return null
    }

    console.log('✅ User found:', user.username, 'with status:', user.status, '| user_level:', user.user_level)

    // Check if password matches using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (isPasswordValid) {
      console.log('✅ Password is valid for user:', user.username, '| Returning user with user_level:', user.user_level)
      return user
    }

    console.log('❌ Password is invalid')
    return null
  } catch (error) {
    console.error("Error validating user credentials:", error)
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  try {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  } catch (error) {
    console.error("Error hashing password:", error)
    throw new Error("Failed to hash password")
  }
}

export async function getAllUsers(): Promise<users[]> {
  try {
    const allUsers = await prisma.users.findMany({
      where: {
        status: 1, // Only status 1 is active
      },
      orderBy: {
        created_at: "desc",
      },
    })
    return allUsers
  } catch (error) {
    console.error("Error fetching all users:", error)
    return []
  }
}