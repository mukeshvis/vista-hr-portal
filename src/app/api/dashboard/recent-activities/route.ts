import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/database/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session || !session.user) {
      console.log('❌ Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = session.user.user_level === 1 || session.user.user_level === '1'
    if (!isAdmin) {
      console.log('❌ Forbidden - not admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('✅ Fetching recent activities...')
    const activities: any[] = []
    const now = new Date()

    // 1. Get recent employee additions (last 30 days instead of 7)
    try {
      const recentEmployees = await prisma.employee.findMany({
        where: {
          emp_joining_date: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: {
          emp_joining_date: 'desc'
        },
        take: 3,
        select: {
          emp_name: true,
          emp_joining_date: true
        }
      })

      console.log(`📊 Found ${recentEmployees.length} recent employees`)

      recentEmployees.forEach(emp => {
        if (emp.emp_joining_date) {
          activities.push({
            action: 'New employee joined',
            user: emp.emp_name || 'Unknown',
            time: getTimeAgo(new Date(emp.emp_joining_date)),
            type: 'success',
            icon: 'Users'
          })
        }
      })
    } catch (error) {
      console.error('❌ Error fetching employees:', error)
    }

    // 2. Get recent leave applications (last 30 days)
    try {
      const recentLeaves = await prisma.leave_application.findMany({
        where: {
          date: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: {
          date: 'desc'
        },
        take: 5
      })

      console.log(`📊 Found ${recentLeaves.length} recent leaves`)

      // Get employee names for these leaves
      for (const leave of recentLeaves) {
        try {
          const employee = await prisma.employee.findFirst({
            where: { emp_id: leave.emp_id },
            select: { emp_name: true }
          })

          const leaveType = await prisma.leave_type.findFirst({
            where: { id: leave.leave_type },
            select: { leave_type_name: true }
          })

          const status = leave.approval_status === 0 ? 'pending' : leave.approval_status === 1 ? 'success' : 'info'
          activities.push({
            action: `${leaveType?.leave_type_name || 'Leave'} request ${leave.approval_status === 0 ? 'submitted' : leave.approval_status === 1 ? 'approved' : 'processed'}`,
            user: employee?.emp_name || leave.emp_id,
            time: getTimeAgo(new Date(leave.date)),
            type: status,
            icon: 'Calendar'
          })
        } catch (err) {
          console.error('Error processing leave:', err)
        }
      }
    } catch (error) {
      console.error('❌ Error fetching leaves:', error)
    }

    // 3. Get recent attendance (last 3 days)
    try {
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      threeDaysAgo.setHours(0, 0, 0, 0)

      const recentAttendance = await prisma.user_attendance.findMany({
        where: {
          punch_time: {
            gte: threeDaysAgo
          },
          state: 'Check In' // Check-in only
        },
        orderBy: {
          punch_time: 'desc'
        },
        take: 5
      })

      console.log(`📊 Found ${recentAttendance.length} recent attendance`)

      // Get employee names for attendance
      for (const att of recentAttendance) {
        try {
          const employee = await prisma.employee.findFirst({
            where: { emp_id: att.user_id },
            select: { emp_name: true }
          })

          activities.push({
            action: 'Checked in',
            user: employee?.emp_name || att.user_id,
            time: getTimeAgo(new Date(att.punch_time)),
            type: 'success',
            icon: 'Clock'
          })
        } catch (err) {
          console.error('Error processing attendance:', err)
        }
      }
    } catch (error) {
      console.error('❌ Error fetching attendance:', error)
    }

    // 4. Get recent remote work applications (last 30 days)
    try {
      const recentRemote = await prisma.remote_application.findMany({
        where: {
          application_date: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: {
          application_date: 'desc'
        },
        take: 3
      })

      console.log(`📊 Found ${recentRemote.length} recent remote applications`)

      // Get employee names for remote applications
      for (const remote of recentRemote) {
        try {
          const employee = await prisma.employee.findFirst({
            where: { emp_id: remote.emp_id },
            select: { emp_name: true }
          })

          const status = remote.approved === 0 ? 'pending' : remote.approved === 1 ? 'success' : 'info'
          activities.push({
            action: `Remote work ${remote.approved === 0 ? 'requested' : remote.approved === 1 ? 'approved' : 'processed'}`,
            user: employee?.emp_name || remote.emp_id,
            time: getTimeAgo(new Date(remote.application_date)),
            type: status,
            icon: 'CheckCircle'
          })
        } catch (err) {
          console.error('Error processing remote work:', err)
        }
      }
    } catch (error) {
      console.error('❌ Error fetching remote work:', error)
    }

    // Sort all activities by time (most recent first)
    activities.sort((a, b) => {
      return getTimeValue(a.time) - getTimeValue(b.time)
    })

    console.log(`✅ Total activities found: ${activities.length}`)

    // Return top 10 activities
    return NextResponse.json(activities.slice(0, 10))

  } catch (error) {
    console.error('Error fetching recent activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to convert date to "time ago" format
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return date.toLocaleDateString('en-GB')
}

// Helper function to get numeric value for sorting
function getTimeValue(timeStr: string): number {
  if (timeStr === 'Just now') return 0
  if (timeStr.includes('minute')) {
    const mins = parseInt(timeStr)
    return mins
  }
  if (timeStr.includes('hour')) {
    const hours = parseInt(timeStr)
    return hours * 60
  }
  if (timeStr.includes('day')) {
    const days = parseInt(timeStr)
    return days * 24 * 60
  }
  return 99999 // Very old
}
