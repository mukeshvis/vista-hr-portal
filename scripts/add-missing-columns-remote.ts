import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addMissingColumns() {
  try {
    console.log('🔄 Adding missing columns to remote_application table...')

    // Add created_at column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE remote_application
      ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    `)
    console.log('✅ Added created_at column')

    // Add updated_at column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE remote_application
      ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `)
    console.log('✅ Added updated_at column')

    console.log('\n✅ All missing columns added successfully!')

  } catch (error) {
    console.error('❌ Error adding columns:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addMissingColumns()
  .then(() => {
    console.log('✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
