import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function createRemoteApplicationTable() {
  try {
    console.log('🔄 Creating remote_application table...')

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'prisma', 'migrations', 'create-remote-application-table.sql')
    const sql = fs.readFileSync(sqlFilePath, 'utf8')

    // Execute the SQL
    await prisma.$executeRawUnsafe(sql)

    console.log('✅ Successfully created remote_application table!')
    console.log('✅ Table structure:')
    console.log('   - id (INT, PRIMARY KEY, AUTO_INCREMENT)')
    console.log('   - emp_id (VARCHAR(50))')
    console.log('   - employee_name (VARCHAR(255))')
    console.log('   - date (DATE)')
    console.log('   - reason (TEXT)')
    console.log('   - application_date (DATETIME)')
    console.log('   - approval_status (VARCHAR(50))')
    console.log('   - approved (TINYINT)')
    console.log('   - approved_by (VARCHAR(50))')
    console.log('   - approved_date (DATETIME)')
    console.log('   - rejection_reason (TEXT)')
    console.log('   - manager_id (INT)')
    console.log('   - manager_name (VARCHAR(255))')
    console.log('   - status (TINYINT)')
    console.log('   - created_at (TIMESTAMP)')
    console.log('   - updated_at (TIMESTAMP)')
    console.log('')
    console.log('✅ Indexes created:')
    console.log('   - idx_emp_id')
    console.log('   - idx_date')
    console.log('   - idx_approval_status')
    console.log('   - idx_approved')
    console.log('   - idx_application_date')

  } catch (error) {
    console.error('❌ Error creating table:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createRemoteApplicationTable()
  .then(() => {
    console.log('\n✅ Done! Remote work feature is ready to use.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed to create table:', error)
    process.exit(1)
  })
