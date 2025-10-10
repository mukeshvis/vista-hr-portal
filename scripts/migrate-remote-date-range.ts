import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function migrateRemoteDateRange() {
  try {
    console.log('🔄 Migrating remote_application table to support date ranges...')

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'prisma', 'migrations', 'alter-remote-application-add-date-range.sql')
    const sql = fs.readFileSync(sqlFilePath, 'utf8')

    // Split the SQL file into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📋 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}...`)
      console.log(`   ${statement.substring(0, 80)}${statement.length > 80 ? '...' : ''}`)

      await prisma.$executeRawUnsafe(statement)
      console.log(`   ✅ Statement ${i + 1} executed successfully`)
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('✅ New columns added:')
    console.log('   - from_date (DATE, NOT NULL)')
    console.log('   - to_date (DATE, NOT NULL)')
    console.log('   - number_of_days (INT, NOT NULL, DEFAULT 1)')
    console.log('\n✅ New indexes created:')
    console.log('   - idx_from_date')
    console.log('   - idx_to_date')
    console.log('\n✅ Existing data migrated:')
    console.log('   - All existing single dates copied to from_date and to_date')
    console.log('   - number_of_days set to 1 for all existing records')

  } catch (error) {
    console.error('❌ Error during migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateRemoteDateRange()
  .then(() => {
    console.log('\n✅ Done! Remote work date range feature is ready.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })
