import cron from 'node-cron'

// Background sync service for attendance data
export class AttendanceSyncService {
  private static instance: AttendanceSyncService
  private cronJob: cron.ScheduledTask | null = null
  private isRunning = false

  private constructor() {}

  static getInstance(): AttendanceSyncService {
    if (!AttendanceSyncService.instance) {
      AttendanceSyncService.instance = new AttendanceSyncService()
    }
    return AttendanceSyncService.instance
  }

  // Sync attendance data
  private async syncAttendance() {
    if (this.isRunning) {
      console.log('⏭️ Sync already running, skipping...')
      return
    }

    try {
      this.isRunning = true

      const now = new Date()
      const day = String(now.getDate()).padStart(2, '0')
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const year = now.getFullYear()
      const dateStr = `${day}/${month}/${year}`

      console.log(`\n🔄 [${now.toLocaleTimeString()}] Starting attendance sync for ${dateStr}...`)

      // Use localhost for internal API calls (works in Docker)
      const port = process.env.PORT || '3000'
      const baseUrl = `http://localhost:${port}`

      const response = await fetch(`${baseUrl}/api/attendance/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: dateStr,
          end_date: dateStr
        })
      })

      const result = await response.json()

      if (result.success) {
        console.log(`✅ Sync successful:`)
        console.log(`   - New records: ${result.synced}`)
        console.log(`   - Duplicates skipped: ${result.skipped}`)
        console.log(`   - Total: ${result.total}`)
      } else {
        console.error(`❌ Sync failed: ${result.error}`)
      }

    } catch (error: any) {
      console.error(`❌ Sync error:`, error.message)
    } finally {
      this.isRunning = false
    }
  }

  // Check if today is a weekday (Monday-Friday)
  private isWeekday(): boolean {
    const day = new Date().getDay()
    return day >= 1 && day <= 5 // 1=Monday, 5=Friday
  }

  // Check if current time is within working hours (9 AM - 6 PM)
  private isWorkingHours(): boolean {
    const hour = new Date().getHours()
    return hour >= 9 && hour < 18 // 9 AM to 6 PM
  }

  // Start the cron job
  start() {
    if (this.cronJob) {
      console.log('⚠️ Sync service already running')
      return
    }

    // Run every hour (at minute 0)
    // Cron expression: '0 * * * *' = At minute 0 of every hour
    this.cronJob = cron.schedule('0 * * * *', async () => {
      // Check if it's weekday and working hours
      if (!this.isWeekday()) {
        console.log('📅 Weekend - Skipping sync')
        return
      }

      if (!this.isWorkingHours()) {
        const hour = new Date().getHours()
        console.log(`⏰ Outside working hours (${hour}:00) - Skipping sync`)
        return
      }

      // Run the sync
      await this.syncAttendance()
    })

    console.log('✅ Attendance sync service started!')
    console.log('📅 Schedule: Every hour, 9 AM - 6 PM, Monday - Friday')
    console.log('⏰ Next sync will run at the top of the next hour')

    // Run initial sync if within working hours and weekday
    if (this.isWeekday() && this.isWorkingHours()) {
      console.log('🚀 Running initial sync...')
      this.syncAttendance()
    }
  }

  // Stop the cron job
  stop() {
    if (this.cronJob) {
      this.cronJob.stop()
      this.cronJob = null
      console.log('🛑 Attendance sync service stopped')
    }
  }

  // Get service status
  getStatus() {
    return {
      isRunning: !!this.cronJob,
      isWeekday: this.isWeekday(),
      isWorkingHours: this.isWorkingHours(),
      currentTime: new Date().toLocaleString(),
      syncInProgress: this.isRunning
    }
  }
}

// Export singleton instance
export const attendanceSyncService = AttendanceSyncService.getInstance()
