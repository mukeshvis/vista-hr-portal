import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function recreateRemoteApplicationTable() {
  try {
    console.log('🔄 Dropping existing remote_application table...')

    // Drop the existing table
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS `remote_application`')
    console.log('✅ Table dropped successfully')

    console.log('\n🔄 Creating new remote_application table with correct schema...')

    // Create new table with all required columns
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`remote_application\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`emp_id\` VARCHAR(50) NOT NULL,
        \`employee_name\` VARCHAR(255) NOT NULL,
        \`from_date\` DATE NOT NULL,
        \`to_date\` DATE NOT NULL,
        \`number_of_days\` INT NOT NULL DEFAULT 1,
        \`date\` DATE NOT NULL,
        \`reason\` TEXT NULL,
        \`application_date\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`approval_status\` VARCHAR(50) NOT NULL DEFAULT 'Pending',
        \`approved\` TINYINT NOT NULL DEFAULT 0,
        \`approved_by\` VARCHAR(255) NULL,
        \`approved_date\` DATETIME NULL,
        \`rejection_reason\` TEXT NULL,
        \`manager_id\` VARCHAR(50) NULL,
        \`manager_name\` VARCHAR(255) NULL,
        \`status\` TINYINT NOT NULL DEFAULT 1,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_emp_id\` (\`emp_id\`),
        INDEX \`idx_from_date\` (\`from_date\`),
        INDEX \`idx_to_date\` (\`to_date\`),
        INDEX \`idx_approved\` (\`approved\`),
        INDEX \`idx_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    console.log('✅ New remote_application table created successfully!')
    console.log('\n✅ Table structure:')
    console.log('   - id (INT, AUTO_INCREMENT, PRIMARY KEY)')
    console.log('   - emp_id (VARCHAR(50))')
    console.log('   - employee_name (VARCHAR(255))')
    console.log('   - from_date (DATE) - Start date of remote work')
    console.log('   - to_date (DATE) - End date of remote work')
    console.log('   - number_of_days (INT) - Number of remote days')
    console.log('   - date (DATE) - For backward compatibility')
    console.log('   - reason (TEXT)')
    console.log('   - application_date (DATETIME)')
    console.log('   - approval_status (VARCHAR(50))')
    console.log('   - approved (TINYINT) - 0=Pending, 1=Approved, 2=Rejected')
    console.log('   - approved_by (VARCHAR(255))')
    console.log('   - approved_date (DATETIME)')
    console.log('   - rejection_reason (TEXT)')
    console.log('   - manager_id (VARCHAR(50))')
    console.log('   - manager_name (VARCHAR(255))')
    console.log('   - status (TINYINT) - 1=Active, -1=Deleted')
    console.log('\n✅ Indexes created:')
    console.log('   - idx_emp_id')
    console.log('   - idx_from_date')
    console.log('   - idx_to_date')
    console.log('   - idx_approved')
    console.log('   - idx_status')

  } catch (error) {
    console.error('❌ Error recreating remote_application table:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

recreateRemoteApplicationTable()
  .then(() => {
    console.log('\n✅ Done! Remote application table has been recreated.')
    console.log('✅ You can now run: npx prisma generate')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed to recreate table:', error)
    process.exit(1)
  })
