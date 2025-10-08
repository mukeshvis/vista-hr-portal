// Initialize all background services
import { attendanceSyncService } from '../services/attendance-sync.service'

export function initializeServices() {
  // Start attendance sync service
  // DISABLED: Attendance sync temporarily disabled
  // attendanceSyncService.start()

  console.log('🚀 All background services initialized')
}
