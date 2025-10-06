// Scheduled Attendance Sync
// Run this as a cron job to sync data automatically

export async function syncDailyAttendance() {
  try {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    const dateStr = `${day}/${month}/${year}`

    console.log(`🔄 Auto-syncing attendance for ${dateStr}...`)

    const response = await fetch('http://localhost:3000/api/attendance/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_date: dateStr,
        end_date: dateStr
      })
    })

    const result = await response.json()

    if (result.success) {
      console.log(`✅ Auto-sync successful: ${result.synced} records synced`)
    } else {
      console.error('❌ Auto-sync failed:', result.error)
    }

    return result

  } catch (error) {
    console.error('❌ Auto-sync error:', error)
    return { success: false, error: error }
  }
}

// You can run this with node-cron or Windows Task Scheduler
// Example: Every day at 11:59 PM
// Schedule: 0 23 59 * * *
