import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing leave_application_data table structure...\n')

  try {
    // Step 1: Check if there are any NULL ids
    console.log('Step 1: Checking for NULL ids...')
    const nullIds = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM leave_application_data WHERE id IS NULL
    ` as any[]

    console.log(`Found ${nullIds[0].count} rows with NULL id`)

    // Step 2: Delete rows with NULL ids (if any)
    if (nullIds[0].count > 0) {
      console.log('Step 2: Deleting rows with NULL ids...')
      await prisma.$executeRaw`
        DELETE FROM leave_application_data WHERE id IS NULL
      `
      console.log('✅ Deleted rows with NULL ids')
    }

    // Step 3: Make id column NOT NULL and set it as PRIMARY KEY with AUTO_INCREMENT
    console.log('Step 3: Altering table to add PRIMARY KEY with AUTO_INCREMENT...')

    // First, modify the id column to be NOT NULL and AUTO_INCREMENT
    await prisma.$executeRaw`
      ALTER TABLE leave_application_data
      MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY
    `

    console.log('✅ Successfully altered leave_application_data table!')
    console.log('   - id is now PRIMARY KEY')
    console.log('   - id is now AUTO_INCREMENT')
    console.log('   - id is now NOT NULL\n')

    // Step 4: Verify the changes
    console.log('Step 4: Verifying table structure...')
    const result = await prisma.$queryRaw`
      DESCRIBE leave_application_data
    ` as any[]

    const idColumn = result.find((col: any) => col.Field === 'id')
    console.log('✅ Verification:')
    console.log(`   - Field: ${idColumn.Field}`)
    console.log(`   - Type: ${idColumn.Type}`)
    console.log(`   - Null: ${idColumn.Null}`)
    console.log(`   - Key: ${idColumn.Key}`)
    console.log(`   - Extra: ${idColumn.Extra}`)

  } catch (error: any) {
    console.error('❌ Error:', error)
    console.error('Error details:', error.message)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
