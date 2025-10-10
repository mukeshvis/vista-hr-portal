import { NextRequest, NextResponse } from 'next/server'
import { prisma, executeWithRetry } from '@/lib/database/prisma'

// GET - Validate if employee can apply for remote work and get usage stats
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const empId = searchParams.get('empId')
    const date = searchParams.get('date')

    if (!empId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    // Check if employee is permanent
    const employee = await executeWithRetry(async () => {
      return await prisma.employee.findFirst({
        where: {
          emp_id: empId,
          status: 1
        },
        select: {
          emp_id: true,
          emp_name: true,
          date_of_confirmation: true,
          emp_employementstatus_id: true
        }
      })
    })

    if (!employee) {
      return NextResponse.json(
        {
          canApply: false,
          reason: 'Employee not found'
        },
        { status: 404 }
      )
    }

    if (!employee.date_of_confirmation) {
      return NextResponse.json({
        canApply: false,
        reason: 'Only permanent employees can apply for remote work',
        isPermanent: false
      })
    }

    // Check if already applied for this date
    if (date) {
      const existingApplication = await executeWithRetry(async () => {
        return await prisma.remote_application.findFirst({
          where: {
            emp_id: empId,
            date: new Date(date),
            status: 1
          }
        })
      })

      if (existingApplication) {
        return NextResponse.json({
          canApply: false,
          reason: 'You have already applied for remote work on this date',
          hasExistingApplication: true,
          existingApplication
        })
      }
    }

    // Get 6-month usage
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const last6MonthsApplications = await executeWithRetry(async () => {
      return await prisma.remote_application.findMany({
        where: {
          emp_id: empId,
          approved: 1,
          date: {
            gte: sixMonthsAgo
          },
          status: 1
        },
        orderBy: {
          date: 'desc'
        }
      })
    })

    const last6MonthsCount = last6MonthsApplications.length
    const remaining6Months = 4 - last6MonthsCount

    // Get 1-month usage
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const lastMonthApplications = await executeWithRetry(async () => {
      return await prisma.remote_application.findMany({
        where: {
          emp_id: empId,
          approved: 1,
          date: {
            gte: oneMonthAgo
          },
          status: 1
        },
        orderBy: {
          date: 'desc'
        }
      })
    })

    const lastMonthCount = lastMonthApplications.length
    const remainingMonth = 2 - lastMonthCount

    // Check if can apply
    const canApply = last6MonthsCount < 4 && lastMonthCount < 2

    let reason = ''
    if (last6MonthsCount >= 4) {
      reason = 'You have reached the maximum limit of 4 remote days in 6 months'
    } else if (lastMonthCount >= 2) {
      reason = 'You have reached the maximum limit of 2 remote days in 1 month'
    }

    return NextResponse.json({
      canApply,
      reason: reason || 'You can apply for remote work',
      isPermanent: true,
      usage: {
        sixMonths: {
          used: last6MonthsCount,
          limit: 4,
          remaining: Math.max(0, remaining6Months),
          applications: last6MonthsApplications
        },
        oneMonth: {
          used: lastMonthCount,
          limit: 2,
          remaining: Math.max(0, remainingMonth),
          applications: lastMonthApplications
        }
      }
    })
  } catch (error: any) {
    console.error('❌ Error validating remote work eligibility:', error)
    return NextResponse.json(
      {
        error: 'Failed to validate remote work eligibility',
        details: error.message
      },
      { status: 500 }
    )
  }
}
