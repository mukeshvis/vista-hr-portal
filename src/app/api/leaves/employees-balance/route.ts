import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { auth } from '@/lib/auth/auth'

// Helper function to calculate prorated leaves based on date_of_confirmation
function calculateProratedLeaves(dateOfConfirmation: string | null, leaveYear: number): {
  annual: number
  sick: number
  emergency: number
  total: number
  isProrated: boolean
  remainingMonths: number
} {
  // Standard full-year leaves
  const FULL_ANNUAL = 22
  const FULL_SICK = 10
  const FULL_EMERGENCY = 8
  const FULL_TOTAL = 40

  if (!dateOfConfirmation) {
    console.log('⚠️ No date_of_confirmation found, using full leaves')
    return {
      annual: FULL_ANNUAL,
      sick: FULL_SICK,
      emergency: FULL_EMERGENCY,
      total: FULL_TOTAL,
      isProrated: false,
      remainingMonths: 12
    }
  }

  // Parse date_of_confirmation
  const confirmDate = new Date(dateOfConfirmation)

  // Calculate current leave year boundaries (July 1 to June 30)
  const leaveYearStart = new Date(leaveYear, 6, 1) // July 1
  const leaveYearEnd = new Date(leaveYear + 1, 5, 30) // June 30 next year

  console.log(`📅 Checking proration for confirmation date: ${dateOfConfirmation}`)
  console.log(`📅 Leave year: ${leaveYearStart.toISOString().split('T')[0]} to ${leaveYearEnd.toISOString().split('T')[0]}`)

  // If confirmed before current leave year started, give full leaves
  if (confirmDate < leaveYearStart) {
    console.log(`✅ Employee confirmed before leave year start - Full leaves`)
    return {
      annual: FULL_ANNUAL,
      sick: FULL_SICK,
      emergency: FULL_EMERGENCY,
      total: FULL_TOTAL,
      isProrated: false,
      remainingMonths: 12
    }
  }

  // If confirmed after leave year ends (shouldn't happen but handle it)
  if (confirmDate > leaveYearEnd) {
    console.log(`⚠️ Employee confirmation date is after leave year - No leaves`)
    return {
      annual: 0,
      sick: 0,
      emergency: 0,
      total: 0,
      isProrated: true,
      remainingMonths: 0
    }
  }

  // Employee confirmed within current leave year - calculate proration
  // Count remaining complete months from confirmation date to end of leave year
  const confirmMonth = confirmDate.getMonth()
  const confirmYear = confirmDate.getFullYear()

  // Calculate months from confirmation month to June of next year
  let remainingMonths = 0
  const startMonth = confirmMonth
  const startYear = confirmYear

  // Count from confirmation month to June of leave year end
  for (let year = startYear; year <= leaveYearEnd.getFullYear(); year++) {
    const monthStart = (year === startYear) ? startMonth : 0
    const monthEnd = (year === leaveYearEnd.getFullYear()) ? 5 : 11 // 5 = June (0-indexed)

    for (let month = monthStart; month <= monthEnd; month++) {
      remainingMonths++
    }
  }

  console.log(`📊 Proration calculation:`)
  console.log(`   - Confirmation date: ${confirmDate.toISOString().split('T')[0]}`)
  console.log(`   - Remaining months in leave year: ${remainingMonths}`)

  // Calculate prorated leaves
  const annual = Math.round((FULL_ANNUAL / 12) * remainingMonths)
  const sick = Math.round((FULL_SICK / 12) * remainingMonths)
  const emergency = Math.round((FULL_EMERGENCY / 12) * remainingMonths)
  const total = annual + sick + emergency

  console.log(`   - Prorated leaves: Annual=${annual}, Sick=${sick}, Emergency=${emergency}, Total=${total}`)

  return {
    annual,
    sick,
    emergency,
    total,
    isProrated: true,
    remainingMonths
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting employees-balance API call...')

    // Get current user session
    const session = await auth()
    console.log('🔐 Session check:', session ? 'Found' : 'Not found')

    if (!session?.user) {
      console.log('❌ No session or user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userLevel = session.user.user_level
    const currentUserEmpId = session.user.emp_id
    const isAdmin = userLevel === 1 || userLevel === '1'

    console.log(`👤 User Level: ${userLevel}, Employee ID: ${currentUserEmpId}, Is Admin: ${isAdmin}`)

    // Get year from query params, default to current year
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    const yearNum = parseInt(year)

    // Calculate from July onwards (leave policy year)
    const fromDate = `${yearNum}-07-01`
    console.log(`🔄 Fetching employee balances from ${fromDate} onwards...`)

    // Get only permanent employees (not probation)
    // If user is not admin (level 0), filter to show only their own data
    let employees
    if (!isAdmin && currentUserEmpId) {
      // For regular employees (level 0), show only their own balance
      console.log(`🔒 Filtering for employee: ${currentUserEmpId}`)
      console.log('📝 Running employee query for non-admin...')
      employees = await prisma.$queryRaw`
        SELECT
          e.emp_id,
          e.emp_name as employee_name,
          COALESCE(d.department_name, 'N/A') as department_name,
          COALESCE(des.designation_name, 'N/A') as designation_name,
          e.leaves_policy_id,
          e.reporting_manager,
          CASE
            WHEN CAST(e.date_of_confirmation AS CHAR) = '0000-00-00' THEN NULL
            WHEN e.date_of_confirmation IS NULL THEN NULL
            ELSE CAST(e.date_of_confirmation AS CHAR)
          END as date_of_confirmation
        FROM employee e
        LEFT JOIN department d ON e.emp_department_id = d.id
        LEFT JOIN designation des ON e.designation_id = des.id
        LEFT JOIN emp_empstatus es ON e.emp_employementstatus_id = es.id
        WHERE e.status = 1
        AND e.emp_id IS NOT NULL
        AND e.emp_id != ''
        AND e.emp_id = ${currentUserEmpId}
        AND LOWER(es.job_type_name) = 'permanent'
        ORDER BY e.emp_name ASC
      ` as any[]
    } else {
      // For admins (level 1), show all employees
      console.log(`🔓 Fetching all employees (admin view)`)
      console.log('📝 Running employee query for admin...')
      employees = await prisma.$queryRaw`
        SELECT
          e.emp_id,
          e.emp_name as employee_name,
          COALESCE(d.department_name, 'N/A') as department_name,
          COALESCE(des.designation_name, 'N/A') as designation_name,
          e.leaves_policy_id,
          e.reporting_manager,
          CASE
            WHEN CAST(e.date_of_confirmation AS CHAR) = '0000-00-00' THEN NULL
            WHEN e.date_of_confirmation IS NULL THEN NULL
            ELSE CAST(e.date_of_confirmation AS CHAR)
          END as date_of_confirmation
        FROM employee e
        LEFT JOIN department d ON e.emp_department_id = d.id
        LEFT JOIN designation des ON e.designation_id = des.id
        LEFT JOIN emp_empstatus es ON e.emp_employementstatus_id = es.id
        WHERE e.status = 1
        AND e.emp_id IS NOT NULL
        AND e.emp_id != ''
        AND LOWER(es.job_type_name) = 'permanent'
        ORDER BY e.emp_name ASC
        LIMIT 100
      ` as any[]
    }

    console.log(`✅ Found ${employees.length} permanent employees (probation employees excluded)`)

    // Get manager names
    const managerIds = [...new Set(employees.map((emp: any) => emp.reporting_manager).filter(Boolean))]
    let managerMap = new Map()

    if (managerIds.length > 0) {
      try {
        // Fetch managers one by one or use a safe query
        const managers = await prisma.employee.findMany({
          where: {
            id: {
              in: managerIds.map((id: any) => Number(id))
            }
          },
          select: {
            id: true,
            emp_name: true
          }
        })
        managerMap = new Map(managers.map((m: any) => [Number(m.id), m.emp_name]))
        console.log(`✅ Fetched ${managers.length} manager names`)
      } catch (managerError) {
        console.error('⚠️ Error fetching manager names:', managerError)
        // Continue without manager names
      }
    }

    // Get leave usage for filtered employees
    console.log('📊 Fetching leave usage data...')
    let leaveUsage
    if (!isAdmin && currentUserEmpId) {
      // For regular employees, only get their own leave usage
      leaveUsage = await prisma.$queryRaw`
        SELECT
          la.emp_id,
          lt.leave_type_name,
          SUM(lad.no_of_days) as days_used
        FROM leave_application la
        LEFT JOIN leave_application_data lad ON la.id = lad.leave_application_id
        LEFT JOIN leave_type lt ON la.leave_type = lt.id
        WHERE la.approved = 1
        AND la.emp_id = ${currentUserEmpId}
        AND STR_TO_DATE(lad.from_date, '%Y-%m-%d') >= ${fromDate}
        GROUP BY la.emp_id, lt.leave_type_name
      ` as any[]
    } else {
      // For admins, get all employees' leave usage
      leaveUsage = await prisma.$queryRaw`
        SELECT
          la.emp_id,
          lt.leave_type_name,
          SUM(lad.no_of_days) as days_used
        FROM leave_application la
        LEFT JOIN leave_application_data lad ON la.id = lad.leave_application_id
        LEFT JOIN leave_type lt ON la.leave_type = lt.id
        WHERE la.approved = 1
        AND STR_TO_DATE(lad.from_date, '%Y-%m-%d') >= ${fromDate}
        GROUP BY la.emp_id, lt.leave_type_name
      ` as any[]
    }

    console.log(`✅ Found leave usage for ${leaveUsage.length} records`)

    // Create a map of employee leave usage
    const leaveUsageMap = new Map<string, { annual: number; sick: number; emergency: number; total: number }>()

    leaveUsage.forEach((record: any) => {
      const empId = record.emp_id
      const leaveType = record.leave_type_name?.toLowerCase() || ''
      const daysUsed = Number(record.days_used) || 0

      if (!leaveUsageMap.has(empId)) {
        leaveUsageMap.set(empId, { annual: 0, sick: 0, emergency: 0, total: 0 })
      }

      const usage = leaveUsageMap.get(empId)!

      if (leaveType.includes('annual')) {
        usage.annual += daysUsed
      } else if (leaveType.includes('sick')) {
        usage.sick += daysUsed
      } else if (leaveType.includes('emergency')) {
        usage.emergency += daysUsed
      }

      usage.total += daysUsed
      leaveUsageMap.set(empId, usage)
    })

    // Get policy leaves for each employee
    const policyLeavesData = await prisma.$queryRaw`
      SELECT
        ld.leaves_policy_id,
        MAX(ld.no_of_leaves) as max_leaves
      FROM leaves_data ld
      WHERE ld.status IN (1, 2)
      GROUP BY ld.leaves_policy_id
    ` as any[]

    const policyLeavesMap = new Map<number, number>()
    policyLeavesData.forEach((record: any) => {
      policyLeavesMap.set(record.leaves_policy_id, Number(record.max_leaves) || 40)
    })

    // Build result with prorated leave allocation
    const result = employees.map((emp: any) => {
      try {
        const usage = leaveUsageMap.get(emp.emp_id) || { annual: 0, sick: 0, emergency: 0, total: 0 }

        // Calculate prorated leaves based on date_of_confirmation
        let proratedLeaves
        try {
          proratedLeaves = calculateProratedLeaves(emp.date_of_confirmation, yearNum)
        } catch (prorationError) {
          console.error(`⚠️ Proration calculation failed for ${emp.emp_id}:`, prorationError)
          // Fallback to full leaves on error
          proratedLeaves = {
            annual: 22,
            sick: 10,
            emergency: 8,
            total: 40,
            isProrated: false,
            remainingMonths: 12
          }
        }

        console.log(`👤 Employee: ${emp.emp_id} (${emp.employee_name})`)
        console.log(`   - Confirmation date: ${emp.date_of_confirmation || 'N/A'}`)
        console.log(`   - Allocated leaves: ${proratedLeaves.total} (Annual: ${proratedLeaves.annual}, Sick: ${proratedLeaves.sick}, Emergency: ${proratedLeaves.emergency})`)
        console.log(`   - Prorated: ${proratedLeaves.isProrated ? 'Yes' : 'No'}`)

        const totalAllocated = proratedLeaves.total
        const totalRemaining = totalAllocated - usage.total

        return {
          emp_id: emp.emp_id,
          employee_name: emp.employee_name,
          department_name: emp.department_name || 'N/A',
          designation_name: emp.designation_name || 'N/A',
          manager_name: managerMap.get(Number(emp.reporting_manager)) || 'N/A',
          total_allocated: totalAllocated,
          total_used: usage.total,
          total_remaining: totalRemaining,
          total_applications: 0,
          annual_used: usage.annual,
          sick_used: usage.sick,
          emergency_used: usage.emergency,
          // Additional proration info
          date_of_confirmation: emp.date_of_confirmation,
          is_prorated: proratedLeaves.isProrated,
          annual_allocated: proratedLeaves.annual,
          sick_allocated: proratedLeaves.sick,
          emergency_allocated: proratedLeaves.emergency
        }
      } catch (empError) {
        console.error(`❌ Error processing employee ${emp.emp_id}:`, empError)
        // Return basic data on error
        return {
          emp_id: emp.emp_id,
          employee_name: emp.employee_name,
          department_name: emp.department_name || 'N/A',
          designation_name: emp.designation_name || 'N/A',
          manager_name: 'N/A',
          total_allocated: 40,
          total_used: 0,
          total_remaining: 40,
          total_applications: 0,
          annual_used: 0,
          sick_used: 0,
          emergency_used: 0,
          date_of_confirmation: null,
          is_prorated: false,
          annual_allocated: 22,
          sick_allocated: 10,
          emergency_allocated: 8
        }
      }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ Error fetching employees balance:', error)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error stack:', error.stack)
    console.error('❌ Error full:', JSON.stringify(error, null, 2))

    // Return detailed error for debugging
    return NextResponse.json({
      error: 'Failed to fetch employees balance',
      details: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
      errorType: error.constructor?.name
    }, { status: 500 })
  }
}
