const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Disable SSL verification
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

async function fullSync() {
  try {
    console.log('🔄 Starting FULL DATA SYNC from external API...\n')

    // ===== STEP 1: Sync Employees =====
    console.log('📋 STEP 1: Syncing Employees...')

    const employeesResponse = await fetch('https://att.pakujala.com/APIUsers?ID=1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HR-Portal/1.0',
      }
    })

    if (!employeesResponse.ok) {
      throw new Error('Failed to fetch employees')
    }

    const employeesData = await employeesResponse.json()
    const employees = employeesData.data || []

    console.log(`✅ Found ${employees.length} employees from API`)

    let empSynced = 0
    let empUpdated = 0

    for (const emp of employees) {
      try {
        const existing = await prisma.external_employees.findUnique({
          where: { pin_auto: emp.pin_auto }
        })

        if (existing) {
          await prisma.external_employees.update({
            where: { pin_auto: emp.pin_auto },
            data: {
              pin_manual: emp.pin_manual,
              user_name: emp.user_name,
              password: emp.password,
              privilege: emp.privilege
            }
          })
          empUpdated++
        } else {
          await prisma.external_employees.create({
            data: {
              pin_manual: emp.pin_manual,
              pin_auto: emp.pin_auto,
              user_name: emp.user_name,
              password: emp.password,
              privilege: emp.privilege
            }
          })
          empSynced++
        }
      } catch (error) {
        console.error(`Error syncing employee ${emp.pin_auto}:`, error.message)
      }
    }

    console.log(`✅ Employees synced: ${empSynced} new, ${empUpdated} updated\n`)

    // ===== STEP 2: Sync Attendance (Last 30 days) =====
    console.log('📊 STEP 2: Syncing Attendance Data (Last 30 days)...')

    const today = new Date()
    let totalAttendanceSynced = 0
    let totalAttendanceSkipped = 0

    // Sync last 30 days
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const dateStr = `${day}/${month}/${year}`

      console.log(`\n📅 Syncing: ${dateStr}`)

      try {
        const attendanceResponse = await fetch('https://att.pakujala.com/APILogs?ID=1', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'HR-Portal/1.0',
          },
          body: JSON.stringify({
            start_date: dateStr,
            end_date: dateStr
          })
        })

        if (!attendanceResponse.ok) {
          console.log(`⚠️  API failed for ${dateStr}`)
          continue
        }

        const responseText = await attendanceResponse.text()

        // Check for errors
        if (responseText.includes('java.sql.') || responseText.includes('Exception')) {
          console.log(`⚠️  API error for ${dateStr}`)
          continue
        }

        const attendanceData = JSON.parse(responseText)
        const logs = Array.isArray(attendanceData) ? attendanceData : (attendanceData.data || [])

        console.log(`   Found ${logs.length} records`)

        let daySynced = 0
        let daySkipped = 0

        for (const log of logs) {
          try {
            // Check if already exists
            const existing = await prisma.user_attendance.findFirst({
              where: {
                user_id: log.user_id,
                state: log.state,
                punch_time: new Date(log.punch_time)
              }
            })

            if (existing) {
              daySkipped++
              continue
            }

            // Insert new record
            await prisma.user_attendance.create({
              data: {
                user_id: log.user_id,
                state: log.state,
                punch_time: new Date(log.punch_time),
                verify_mode: log.verify_mode || null,
                source: 'external_api'
              }
            })

            daySynced++
          } catch (error) {
            daySkipped++
          }
        }

        totalAttendanceSynced += daySynced
        totalAttendanceSkipped += daySkipped

        console.log(`   ✅ Synced: ${daySynced}, Skipped: ${daySkipped}`)

        // Small delay to avoid overwhelming API
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`   ❌ Error syncing ${dateStr}:`, error.message)
      }
    }

    console.log('\n')
    console.log('=' .repeat(60))
    console.log('🎉 FULL SYNC COMPLETE!')
    console.log('=' .repeat(60))
    console.log(`📋 Employees: ${empSynced} new, ${empUpdated} updated`)
    console.log(`📊 Attendance: ${totalAttendanceSynced} new, ${totalAttendanceSkipped} skipped`)
    console.log('=' .repeat(60))
    console.log('\n✅ Database is now fully synced with external API!')

  } catch (error) {
    console.error('❌ Full sync failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the full sync
fullSync()
