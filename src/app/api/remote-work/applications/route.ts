import { NextRequest, NextResponse } from 'next/server'
import { prisma, executeWithRetry } from '@/lib/database/prisma'

// GET - Fetch remote work applications
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const empId = searchParams.get('empId')
    const type = searchParams.get('type') // 'my' or 'all' or 'pending'

    let query = `
      SELECT
        ra.id,
        ra.emp_id,
        ra.employee_name,
        ra.from_date,
        ra.to_date,
        ra.number_of_days,
        ra.date,
        ra.reason,
        ra.application_date,
        ra.approval_status,
        ra.approved,
        ra.approved_by,
        ra.approved_date,
        ra.rejection_reason,
        ra.manager_id,
        m.emp_name as manager_name,
        ra.status
      FROM remote_application ra
      LEFT JOIN employee e ON ra.emp_id = e.emp_id
      LEFT JOIN employee m ON e.reporting_manager = m.id
      LEFT JOIN emp_empstatus es ON e.emp_employementstatus_id = es.id
      WHERE ra.status = 1
      AND LOWER(es.job_type_name) = 'permanent'
    `

    // Filter by employee
    if (empId) {
      query += ` AND ra.emp_id = '${empId}'`
    }

    // Filter by type
    if (type === 'pending') {
      query += ` AND ra.approved = 0`
    } else if (type === 'my' && empId) {
      query += ` AND ra.emp_id = '${empId}'`
    }

    query += ` ORDER BY ra.application_date DESC`

    const applications = await executeWithRetry(async () => {
      return await prisma.$queryRawUnsafe(query) as any[]
    })

    console.log(`✅ Fetched ${applications.length} remote work applications`)

    return NextResponse.json(applications)
  } catch (error) {
    console.error('❌ Error fetching remote applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch remote applications' },
      { status: 500 }
    )
  }
}

// POST - Create new remote work application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { empId, employeeName, fromDate, toDate, numberOfDays, reason, managerId, managerName } = body

    // Validation
    if (!empId || !employeeName || !fromDate || !toDate) {
      return NextResponse.json(
        { error: 'Employee ID, name, from date, and to date are required' },
        { status: 400 }
      )
    }

    // Validate date range
    const from = new Date(fromDate)
    const to = new Date(toDate)
    if (to < from) {
      return NextResponse.json(
        { error: 'To date must be greater than or equal to from date' },
        { status: 400 }
      )
    }

    // Check if employee is permanent (date_of_confirmation should be set)
    const employee = await executeWithRetry(async () => {
      return await prisma.employee.findFirst({
        where: {
          emp_id: empId,
          status: 1
        },
        select: {
          date_of_confirmation: true,
          emp_employementstatus_id: true
        }
      })
    })

    if (!employee || !employee.date_of_confirmation) {
      return NextResponse.json(
        { error: 'Only permanent employees can apply for remote work' },
        { status: 403 }
      )
    }

    // Check if already applied for overlapping dates
    // NOTE: This uses the new schema fields (from_date, to_date) which require migration
    // Run: npx ts-node scripts/migrate-remote-date-range.ts
    try {
      const existingApplications = await executeWithRetry(async () => {
        return await prisma.remote_application.findMany({
          where: {
            emp_id: empId,
            status: 1,
            OR: [
              {
                AND: [
                  { from_date: { lte: new Date(toDate) } } as any,
                  { to_date: { gte: new Date(fromDate) } } as any
                ]
              }
            ]
          }
        } as any)
      })

      if (existingApplications.length > 0) {
        return NextResponse.json(
          { error: 'You have already applied for remote work in this date range' },
          { status: 409 }
        )
      }
    } catch (prismaError: any) {
      // If the error is about unknown fields or non-existent columns, the migration hasn't been run yet
      if (prismaError.message?.includes('Unknown argument') ||
          prismaError.message?.includes('does not exist in the current database') ||
          prismaError.code === 'P2022') {
        return NextResponse.json(
          {
            error: 'Database migration required',
            details: 'The remote work date range feature requires a database migration. Please:\n1. Stop dev server (Ctrl+C)\n2. Run: npx ts-node scripts/migrate-remote-date-range.ts\n3. Run: npx prisma generate\n4. Restart: npm run dev'
          },
          { status: 500 }
        )
      }
      throw prismaError // Re-throw if it's a different error
    }

    // Validate 6-month rule (max 4 remote days in 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    try {
      const last6MonthsApplications = await executeWithRetry(async () => {
        return await prisma.remote_application.findMany({
          where: {
            emp_id: empId,
            approved: 1,
            from_date: {
              gte: sixMonthsAgo
            } as any,
            status: 1
          },
          select: {
            number_of_days: true
          } as any
        } as any)
      })

      const last6MonthsDays = last6MonthsApplications.reduce((sum, app: any) => sum + app.number_of_days, 0)

      if (last6MonthsDays + numberOfDays > 4) {
        return NextResponse.json(
          {
            error: 'You have reached the maximum limit of 4 remote days in 6 months',
            details: `You have used ${last6MonthsDays} days in the last 6 months. Adding ${numberOfDays} more would exceed the limit.`
          },
          { status: 403 }
        )
      }
    } catch (prismaError: any) {
      if (prismaError.message?.includes('Unknown argument') ||
          prismaError.message?.includes('does not exist in the current database') ||
          prismaError.code === 'P2022') {
        return NextResponse.json(
          {
            error: 'Database migration required',
            details: 'Please:\n1. Stop dev server (Ctrl+C)\n2. Run: npx ts-node scripts/migrate-remote-date-range.ts\n3. Run: npx prisma generate\n4. Restart: npm run dev'
          },
          { status: 500 }
        )
      }
      throw prismaError
    }

    // Validate 1-month rule (max 2 remote days in 1 month)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    try {
      const lastMonthApplications = await executeWithRetry(async () => {
        return await prisma.remote_application.findMany({
          where: {
            emp_id: empId,
            approved: 1,
            from_date: {
              gte: oneMonthAgo
            } as any,
            status: 1
          },
          select: {
            number_of_days: true
          } as any
        } as any)
      })

      const lastMonthDays = lastMonthApplications.reduce((sum, app: any) => sum + app.number_of_days, 0)

      if (lastMonthDays + numberOfDays > 2) {
        return NextResponse.json(
          {
            error: 'You have reached the maximum limit of 2 remote days in 1 month',
            details: `You have used ${lastMonthDays} days in the last month. Adding ${numberOfDays} more would exceed the limit.`
          },
          { status: 403 }
        )
      }
    } catch (prismaError: any) {
      if (prismaError.message?.includes('Unknown argument') ||
          prismaError.message?.includes('does not exist in the current database') ||
          prismaError.code === 'P2022') {
        return NextResponse.json(
          {
            error: 'Database migration required',
            details: 'Please:\n1. Stop dev server (Ctrl+C)\n2. Run: npx ts-node scripts/migrate-remote-date-range.ts\n3. Run: npx prisma generate\n4. Restart: npm run dev'
          },
          { status: 500 }
        )
      }
      throw prismaError
    }

    // Create remote application
    try {
      const newApplication = await executeWithRetry(async () => {
        return await prisma.remote_application.create({
          data: {
            emp_id: empId,
            employee_name: employeeName,
            from_date: new Date(fromDate),
            to_date: new Date(toDate),
            number_of_days: numberOfDays,
            date: new Date(fromDate), // Keep for backward compatibility
            reason: reason || null,
            manager_id: managerId || null,
            manager_name: managerName || null,
            approval_status: 'Pending',
            approved: 0,
            status: 1
          } as any
        })
      })

      console.log('✅ Remote work application created:', newApplication.id)

      return NextResponse.json({
        success: true,
        application: newApplication,
        message: 'Remote work application submitted successfully'
      })
    } catch (prismaError: any) {
      if (prismaError.message?.includes('Unknown argument') ||
          prismaError.message?.includes('Unknown field') ||
          prismaError.message?.includes('does not exist in the current database') ||
          prismaError.code === 'P2022') {
        return NextResponse.json(
          {
            error: 'Database migration required',
            details: 'Please:\n1. Stop dev server (Ctrl+C)\n2. Run: npx ts-node scripts/migrate-remote-date-range.ts\n3. Run: npx prisma generate\n4. Restart: npm run dev'
          },
          { status: 500 }
        )
      }
      throw prismaError
    }
  } catch (error: any) {
    console.error('❌ Error creating remote application:', error)
    return NextResponse.json(
      {
        error: 'Failed to create remote application',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// PUT - Update/Approve/Reject remote work application
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, approvedBy, rejectionReason, fromDate, toDate, numberOfDays, reason } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      )
    }

    let updateData: any = {}

    // Check if this is an edit operation (date/reason update)
    if (fromDate !== undefined || toDate !== undefined || reason !== undefined) {
      // Edit operation
      if (fromDate && toDate) {
        // Validate date range
        const from = new Date(fromDate)
        const to = new Date(toDate)
        if (to < from) {
          return NextResponse.json(
            { error: 'To date must be greater than or equal to from date' },
            { status: 400 }
          )
        }

        updateData.from_date = from
        updateData.to_date = to
        updateData.number_of_days = numberOfDays
        updateData.date = from // Keep for backward compatibility
      }
      if (reason !== undefined) {
        updateData.reason = reason || null
      }

      const updatedApplication = await executeWithRetry(async () => {
        return await prisma.remote_application.update({
          where: { id: parseInt(id) },
          data: updateData
        })
      })

      console.log('✅ Remote application updated:', updatedApplication.id)

      return NextResponse.json({
        success: true,
        application: updatedApplication,
        message: 'Remote work application updated successfully'
      })
    }

    // Otherwise, this is an approve/reject operation
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action (approve/reject) is required' },
        { status: 400 }
      )
    }

    updateData = {
      approved: action === 'approve' ? 1 : 2,
      approval_status: action === 'approve' ? 'Approved' : 'Rejected',
      approved_by: approvedBy || 'system',
      approved_date: new Date()
    }

    if (action === 'reject' && rejectionReason) {
      updateData.rejection_reason = rejectionReason
    }

    const updatedApplication = await executeWithRetry(async () => {
      return await prisma.remote_application.update({
        where: { id: parseInt(id) },
        data: updateData
      })
    })

    console.log(`✅ Remote application ${action}d:`, updatedApplication.id)

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: `Remote work application ${action}d successfully`
    })
  } catch (error: any) {
    console.error('❌ Error updating remote application:', error)
    return NextResponse.json(
      {
        error: 'Failed to update remote application',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete remote work application
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      )
    }

    // Soft delete
    await executeWithRetry(async () => {
      return await prisma.remote_application.update({
        where: { id: parseInt(id) },
        data: { status: -1 }
      })
    })

    console.log('✅ Remote application deleted:', id)

    return NextResponse.json({
      success: true,
      message: 'Remote work application deleted successfully'
    })
  } catch (error: any) {
    console.error('❌ Error deleting remote application:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete remote application',
        details: error.message
      },
      { status: 500 }
    )
  }
}
