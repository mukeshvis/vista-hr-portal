import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

// UPDATE leave application (full edit or status update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    console.log('Updating leave application:', id, data)

    // Check if this is a full edit or just approval status update
    if (data.approvalStatus !== undefined && !data.leaveType) {
      // Hierarchical approval status update
      // data.approverRole: 'manager' or 'hr'

      if (data.approverRole === 'manager') {
        // Manager can only update approval_status_lm
        await prisma.$executeRaw`
          UPDATE leave_application
          SET
            approval_status_lm = ${data.approvalStatus},
            approved = ${data.approvalStatus === 2 ? 0 : data.approved}
          WHERE id = ${parseInt(id)}
        `
      } else if (data.approverRole === 'hr') {
        // HR can only update approval_status if manager already approved
        // Check if manager has approved first
        const leaveApp = await prisma.$queryRaw`
          SELECT approval_status_lm FROM leave_application WHERE id = ${parseInt(id)} LIMIT 1
        ` as any[]

        if (leaveApp[0]?.approval_status_lm !== 1) {
          return NextResponse.json({
            error: 'Manager approval is required before HR can approve'
          }, { status: 400 })
        }

        await prisma.$executeRaw`
          UPDATE leave_application
          SET
            approval_status = ${data.approvalStatus},
            approved = ${data.approved}
          WHERE id = ${parseInt(id)}
        `
      } else {
        // Legacy: Update both (for backward compatibility)
        await prisma.$executeRaw`
          UPDATE leave_application
          SET
            approval_status = ${data.approvalStatus},
            approved = ${data.approved},
            approval_status_lm = ${data.approvalStatusLm || data.approvalStatus}
          WHERE id = ${parseInt(id)}
        `
      }
    } else {
      // Full leave application edit
      const now = new Date()
      const timeStr = now.toTimeString().split(' ')[0]

      await prisma.$executeRaw`
        UPDATE leave_application
        SET
          leave_type = ${parseInt(data.leaveType)},
          leave_day_type = ${parseInt(data.leaveDayType)},
          reason = ${data.reason},
          leave_address = ${data.leaveAddress || 'N/A'},
          time = ${timeStr}
        WHERE id = ${parseInt(id)}
      `

      // Update leave application data
      await prisma.$executeRaw`
        UPDATE leave_application_data
        SET
          leave_type = ${parseInt(data.leaveType)},
          leave_day_type = ${parseInt(data.leaveDayType)},
          no_of_days = ${data.numberOfDays},
          from_date = ${data.fromDate},
          to_date = ${data.toDate},
          date_of_return_to_work = ${data.returnDate || data.toDate},
          first_second_half = ${data.halfDayType || ''},
          first_second_half_date = ${data.halfDayDate || ''},
          time = ${timeStr}
        WHERE leave_application_id = ${parseInt(id)}
      `
    }

    return NextResponse.json({
      success: true,
      message: 'Leave application updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating leave application:', error)
    return NextResponse.json({
      error: 'Failed to update leave application',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE leave application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete leave application data first
    await prisma.$executeRaw`
      DELETE FROM leave_application_data WHERE leave_application_id = ${parseInt(id)}
    `

    // Delete leave application
    await prisma.$executeRaw`
      DELETE FROM leave_application WHERE id = ${parseInt(id)}
    `

    return NextResponse.json({
      success: true,
      message: 'Leave application deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting leave application:', error)
    return NextResponse.json({ error: 'Failed to delete leave application' }, { status: 500 })
  }
}
