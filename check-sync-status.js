const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkStatus() {
  try {
    const employeeCount = await prisma.external_employees.count()
    const attendanceCount = await prisma.user_attendance.count()
    
    // Get date range
    const oldest = await prisma.user_attendance.findFirst({
      orderBy: { punch_time: 'asc' }
    })
    
    const latest = await prisma.user_attendance.findFirst({
      orderBy: { punch_time: 'desc' }
    })
    
    console.log('\n📊 DATABASE STATUS:')
    console.log('=' .repeat(50))
    console.log(`👥 Employees in DB: ${employeeCount}`)
    console.log(`📋 Attendance records: ${attendanceCount}`)
    console.log(`📅 Date range: ${oldest?.punch_time.toISOString().split('T')[0]} to ${latest?.punch_time.toISOString().split('T')[0]}`)
    console.log('=' .repeat(50))
    
    // Check today's data
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const todayCount = await prisma.user_attendance.count({
      where: {
        punch_time: {
          gte: today,
          lt: tomorrow
        }
      }
    })
    
    console.log(`\n📅 Today's attendance records: ${todayCount}`)
    
    if (todayCount > 0) {
      const sample = await prisma.user_attendance.findMany({
        where: {
          punch_time: {
            gte: today,
            lt: tomorrow
          }
        },
        take: 5,
        orderBy: { punch_time: 'asc' }
      })
      
      console.log('\n📋 Sample from today:')
      sample.forEach((r, i) => {
        console.log(`   ${i+1}. User ${r.user_id} - ${r.state} at ${r.punch_time.toLocaleTimeString()}`)
      })
    }
    
    console.log('\n✅ Database is ready for use!\n')
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkStatus()
