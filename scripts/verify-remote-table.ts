import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyTable() {
  try {
    console.log('🔍 Verifying remote_application table...\n')

    // Check if table exists and get its structure
    const result = await prisma.$queryRaw`
      SHOW TABLES LIKE 'remote_application'
    ` as any[]

    if (result.length > 0) {
      console.log('✅ Table exists: remote_application')

      // Get column information
      const columns = await prisma.$queryRaw`
        DESCRIBE remote_application
      ` as any[]

      console.log('\n📋 Table Structure:')
      console.table(columns)

      // Check indexes
      const indexes = await prisma.$queryRaw`
        SHOW INDEXES FROM remote_application
      ` as any[]

      console.log('\n🔑 Indexes:')
      console.table(indexes.map(idx => ({
        Key_name: idx.Key_name,
        Column_name: idx.Column_name,
        Index_type: idx.Index_type
      })))

      console.log('\n✅ Remote application table is ready to use!')
    } else {
      console.log('❌ Table does not exist')
    }

  } catch (error) {
    console.error('❌ Error verifying table:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyTable()
