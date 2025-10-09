import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma Client with connection pooling and timeout settings
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Always cache Prisma Client in globalThis to avoid multiple instances
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

// Connection lifecycle management
let isConnected = false
let connectionRetries = 0
const MAX_RETRIES = 3

// Graceful connection with retry logic
async function connectWithRetry(retryCount = 0): Promise<boolean> {
  try {
    if (isConnected) {
      return true
    }

    console.log('🔄 Attempting to connect to database...')
    await prisma.$connect()
    isConnected = true
    connectionRetries = 0
    console.log('✅ Database connected successfully')
    return true
  } catch (error: any) {
    connectionRetries++
    console.error(`❌ Database connection failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message)

    if (retryCount < MAX_RETRIES - 1) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000) // Exponential backoff, max 5s
      console.log(`⏳ Retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return connectWithRetry(retryCount + 1)
    }

    isConnected = false
    return false
  }
}

// Initialize connection immediately (skip during build)
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'
const skipConnection = process.env.SKIP_DB_CONNECTION === 'true' || isBuildTime

// Force immediate connection on startup
if (!skipConnection) {
  // Connect immediately and block
  ;(async () => {
    try {
      console.log('🚀 Initializing database connection on startup...')
      await connectWithRetry()
      console.log('✅ Database ready for queries')
    } catch (error) {
      console.error('❌ Failed to establish initial database connection:', error)
      console.error('⚠️ Queries will fail until connection is established')
    }
  })()
}

// Ensure connection before query execution
export async function ensureConnection() {
  if (isConnected) {
    return true
  }
  return await connectWithRetry()
}

// Test database connection
export async function testDatabaseConnection() {
  try {
    await prisma.$connect()
    isConnected = true
    console.log('✅ Database connection test successful')
    return true
  } catch (error) {
    isConnected = false
    console.error('❌ Database connection test failed:', error)
    return false
  }
}

// Helper function to execute queries with automatic retry on connection errors
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  retries = 2
): Promise<T> {
  // ALWAYS ensure connection before executing query
  if (!isConnected) {
    console.log('⚠️ Database not connected, attempting to connect...')
    const connected = await connectWithRetry()
    if (!connected) {
      throw new Error('Failed to establish database connection')
    }
  }

  try {
    return await operation()
  } catch (error: any) {
    // Check if it's a connection error
    const isConnectionError =
      error.code === 'P1001' || // Can't reach database server
      error.code === 'P1002' || // Connection timeout
      error.code === 'P1003' || // Database does not exist
      error.code === 'P1008' || // Operations timed out
      error.code === 'P1017' || // Server has closed the connection
      error.name === 'PrismaClientUnknownRequestError' || // Engine not connected
      error.message?.includes('Engine is not yet connected') ||
      error.message?.includes('Connection') ||
      error.message?.includes('ECONNREFUSED')

    if (isConnectionError && retries > 0) {
      console.error(`🔴 Database connection error, retrying... (${retries} attempts left)`)
      console.error(`🔍 Error details: ${error.message}`)
      isConnected = false

      // Try to reconnect
      const reconnected = await connectWithRetry()
      if (reconnected) {
        console.log('🔄 Retrying query after reconnection...')
        await new Promise(resolve => setTimeout(resolve, 500)) // Small delay before retry
        return executeWithRetry(operation, retries - 1)
      }
    }

    throw error
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  console.log('🔌 Disconnecting from database...')
  await prisma.$disconnect()
  isConnected = false
})

process.on('SIGINT', async () => {
  console.log('🔌 SIGINT received: Disconnecting from database...')
  await prisma.$disconnect()
  isConnected = false
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('🔌 SIGTERM received: Disconnecting from database...')
  await prisma.$disconnect()
  isConnected = false
  process.exit(0)
})