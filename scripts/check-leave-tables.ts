import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking leave tables structure...\n')

  try {
    console.log('📋 leave_application table:')
    const leaveApp = await prisma.$queryRaw`DESCRIBE leave_application` as any[]
    leaveApp.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`)
    })

    console.log('\n📋 leave_application_data table:')
    const leaveAppData = await prisma.$queryRaw`DESCRIBE leave_application_data` as any[]
    leaveAppData.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`)
    })
  } catch (error) {
    console.error('❌ Error:', error)
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
