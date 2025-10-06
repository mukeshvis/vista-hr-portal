import { NextResponse } from 'next/server'
import { attendanceSyncService } from '@/lib/services/attendance-sync.service'

// Get sync service status
export async function GET() {
  try {
    const status = attendanceSyncService.getStatus()

    return NextResponse.json({
      success: true,
      status: status,
      message: status.isRunning
        ? 'Sync service is running'
        : 'Sync service is stopped'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get status', details: error.message },
      { status: 500 }
    )
  }
}

// Manual trigger (for testing)
export async function POST() {
  try {
    const status = attendanceSyncService.getStatus()

    if (!status.isWeekday) {
      return NextResponse.json({
        success: false,
        message: 'Today is weekend. Sync only runs Monday-Friday.'
      })
    }

    if (!status.isWorkingHours) {
      return NextResponse.json({
        success: false,
        message: 'Outside working hours (9 AM - 6 PM). Manual sync not allowed.'
      })
    }

    // Trigger manual sync via the main sync endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const today = new Date()
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`

    const response = await fetch(`${baseUrl}/api/attendance/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_date: dateStr,
        end_date: dateStr
      })
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Manual sync triggered',
      result: result
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to trigger manual sync', details: error.message },
      { status: 500 }
    )
  }
}
