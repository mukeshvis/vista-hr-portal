import { prisma } from "../prisma"
import { User } from "@prisma/client"
import bcrypt from "bcryptjs"

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
        status: 1, // Only active users
      },
    })
    return user
  } catch (error) {
    console.error("Error fetching user by email:", error)
    return null
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        username,
        status: 1, // Only active users
      },
    })
    return user
  } catch (error) {
    console.error("Error fetching user by username:", error)
    return null
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
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
): Promise<User | null> {
  try {
    // First find the user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ],
        status: 1, // Only active users
      },
    })

    if (!user) {
      return null
    }

    // Check if password matches using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (isPasswordValid) {
      return user
    }

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

export async function getAllUsers(): Promise<User[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        status: 1, // Only active users
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    return users
  } catch (error) {
    console.error("Error fetching all users:", error)
    return []
  }
}