import { NextRequest, NextResponse } from 'next/server'
import { prisma, executeWithRetry } from '@/lib/database/prisma'

// GET - Fetch all employees with their remote work balances
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const monthParam = searchParams.get('month') // Format: YYYY-MM

    console.log('🔄 Starting to fetch employee remote balances...')
    console.log('📅 Selected month:', monthParam || 'current month')

    // Fetch all permanent employees with manager and designation using raw query
    const employees = await executeWithRetry(async () => {
      console.log('📊 Fetching permanent employees from database...')
      return await prisma.$queryRaw`
        SELECT
          e.emp_id,
          e.emp_name,
          m.emp_name as manager_name,
          des.designation_name
        FROM employee e
        LEFT JOIN employee m ON e.reporting_manager = m.id
        LEFT JOIN designation des ON e.designation_id = des.id
        LEFT JOIN emp_empstatus es ON e.emp_employementstatus_id = es.id
        WHERE e.status = 1
          AND e.date_of_confirmation IS NOT NULL
          AND LOWER(es.job_type_name) = 'permanent'
        ORDER BY e.emp_name ASC
      ` as any[]
    })

    // Calculate remote work balance for each employee
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Calculate date range for selected month
    let monthStartDate: Date
    let monthEndDate: Date

    if (monthParam) {
      // Use selected month
      const [year, month] = monthParam.split('-').map(Number)
      monthStartDate = new Date(year, month - 1, 1) // First day of selected month
      monthEndDate = new Date(year, month, 0, 23, 59, 59) // Last day of selected month
    } else {
      // Use current month (last 30 days)
      monthEndDate = new Date()
      monthStartDate = new Date()
      monthStartDate.setDate(monthStartDate.getDate() - 30)
    }

    console.log('📅 Month range:', monthStartDate.toISOString(), 'to', monthEndDate.toISOString())

    console.log(`✅ Found ${employees.length} permanent employees`)

    const employeeBalances = await Promise.all(
      employees.map(async (employee) => {
        // Get 6-month approved remote applications
        const last6MonthsApplications = await executeWithRetry(async () => {
          console.log(`📅 Fetching 6-month remote apps for ${employee.emp_id}...`)
          return await prisma.remote_application.findMany({
            where: {
              emp_id: employee.emp_id,
              approved: 1,
              from_date: {
                gte: sixMonthsAgo
              } as any,
              status: 1
            },
            orderBy: {
              from_date: 'desc'
            }
          } as any)
        })

        // Get applications for selected month
        const selectedMonthApplications = await executeWithRetry(async () => {
          return await prisma.remote_application.findMany({
            where: {
              emp_id: employee.emp_id,
              approved: 1,
              from_date: {
                gte: monthStartDate,
                lte: monthEndDate
              } as any,
              status: 1
            },
            orderBy: {
              from_date: 'desc'
            }
          } as any)
        })

        // Handle both old (date) and new (from_date/to_date) schema
        const last6MonthsUsed = last6MonthsApplications.reduce((sum: number, app: any) => {
          // If number_of_days exists, use it; otherwise count as 1 day (old schema)
          return sum + (app.number_of_days !== undefined ? app.number_of_days : 1)
        }, 0)
        const selectedMonthUsed = selectedMonthApplications.reduce((sum: number, app: any) => {
          return sum + (app.number_of_days !== undefined ? app.number_of_days : 1)
        }, 0)

        return {
          emp_id: employee.emp_id,
          emp_name: employee.emp_name,
          designation_name: employee.designation_name || 'N/A',
          manager_name: employee.manager_name || 'N/A',
          sixMonths: {
            used: last6MonthsUsed,
            limit: 4,
            remaining: Math.max(0, 4 - last6MonthsUsed),
            applications: last6MonthsApplications
          },
          oneMonth: {
            used: selectedMonthUsed,
            limit: 2,
            remaining: Math.max(0, 2 - selectedMonthUsed),
            applications: selectedMonthApplications
          }
        }
      })
    )

    console.log(`✅ Fetched remote work balances for ${employeeBalances.length} employees`)

    return NextResponse.json(employeeBalances)
  } catch (error: any) {
    console.error('❌ Error fetching employee remote balances:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch employee remote balances',
        details: error.message
      },
      { status: 500 }
    )
  }
}
