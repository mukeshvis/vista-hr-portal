import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get year from query params, default to current year
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    const yearNum = parseInt(year)

    // Calculate from July onwards (leave policy year)
    const fromDate = `${yearNum}-07-01`
    console.log(`🔄 Fetching employee balances from ${fromDate} onwards...`)

    // Get only permanent employees (not probation)
    const employees = await prisma.$queryRaw`
      SELECT
        e.emp_id,
        e.emp_name as employee_name,
        COALESCE(d.department_name, 'N/A') as department_name,
        COALESCE(des.designation_name, 'N/A') as designation_name,
        e.leaves_policy_id,
        e.reporting_manager
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

    console.log(`✅ Found ${employees.length} permanent employees (probation employees excluded)`)

    // Get manager names
    const managerIds = [...new Set(employees.map((emp: any) => emp.reporting_manager).filter(Boolean))]
    let managerMap = new Map()

    if (managerIds.length > 0) {
      const managerIdsList = managerIds.join(',')
      const managers = await prisma.$queryRawUnsafe(`
        SELECT id, emp_name FROM employee WHERE id IN (${managerIdsList})
      `) as any[]
      managerMap = new Map(managers.map((m: any) => [Number(m.id), m.emp_name]))
    }

    // Get leave usage for all employees
    console.log('📊 Fetching leave usage data...')
    const leaveUsage = await prisma.$queryRaw`
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

    // Build result with actual leave usage
    const result = employees.map((emp: any) => {
      const usage = leaveUsageMap.get(emp.emp_id) || { annual: 0, sick: 0, emergency: 0, total: 0 }
      const totalAllocated = policyLeavesMap.get(emp.leaves_policy_id) || 40
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
        emergency_used: usage.emergency
      }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ Error fetching employees balance:', error)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error stack:', error.stack)
    return NextResponse.json({
      error: 'Failed to fetch employees balance',
      details: error.message,
      code: error.code
    }, { status: 500 })
  }
}
