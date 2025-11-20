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
const MAX_RETRIES = 2 // Reduced to prevent host blocking
let connectPromise: Promise<boolean> | null = null // Prevent parallel connections

// Graceful connection with retry logic
async function connectWithRetry(retryCount = 0): Promise<boolean> {
  // If already connecting, return the existing promise
  if (connectPromise) {
    return connectPromise
  }

  connectPromise = (async () => {
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

      // Check if it's a "host blocked" error
      if (error.message?.includes('is blocked') || error.message?.includes('flush-hosts')) {
        console.error('❌ Database host is blocked by MySQL. Administrator needs to run: FLUSH HOSTS;')
        isConnected = false
        return false
      }

      console.error(`❌ Database connection failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message)

      if (retryCount < MAX_RETRIES - 1) {
        const delay = Math.min(2000 * Math.pow(2, retryCount), 10000) // Longer delays: 2s, 4s, max 10s
        console.log(`⏳ Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        connectPromise = null // Reset for retry
        return connectWithRetry(retryCount + 1)
      }

      isConnected = false
      return false
    } finally {
      connectPromise = null
    }
  })()

  return connectPromise
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
  retries = 1 // Reduced to 1 retry to prevent excessive connection attempts
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
    // Check if it's a "host blocked" error - don't retry
    if (error.message?.includes('is blocked') || error.message?.includes('flush-hosts')) {
      console.error('❌ Database host is BLOCKED. Administrator must run: FLUSH HOSTS;')
      throw new Error('Database host blocked by MySQL. Contact administrator to run: FLUSH HOSTS;')
    }

    // Check if it's a connection error
    const isConnectionError =
      error.code === 'P1001' || // Can't reach database server
      error.code === 'P1002' || // Connection timeout
      error.code === 'P1003' || // Database does not exist
      error.code === 'P1008' || // Operations timed out
      error.code === 'P1017' || // Server has closed the connection
      error.code === 'P2010' || // Raw query failed - underlying connector error
      error.name === 'PrismaClientUnknownRequestError' || // Engine not connected
      error.message?.includes('Engine is not yet connected') ||
      error.message?.includes('Connection') ||
      error.message?.includes('Error in the underlying connector') ||
      error.message?.includes('ECONNREFUSED')

    if (isConnectionError && retries > 0) {
      console.error(`🔴 Database connection error, retrying... (${retries} attempts left)`)
      console.error(`🔍 Error details: ${error.message}`)
      isConnected = false

      // Try to reconnect with longer delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      const reconnected = await connectWithRetry()
      if (reconnected) {
        console.log('🔄 Retrying query after reconnection...')
        await new Promise(resolve => setTimeout(resolve, 1000)) // Longer delay before retry
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