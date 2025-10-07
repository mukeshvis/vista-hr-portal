import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Always cache Prisma Client in globalThis (even in production) to avoid multiple instances
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

// Ensure connection on initialization
prisma.$connect().catch((err) => {
  console.error('❌ Failed to connect to database on startup:', err)
  process.exit(1)
})

// Test database connection
export async function testDatabaseConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}