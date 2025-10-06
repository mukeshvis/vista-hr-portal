import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const empId = searchParams.get('empId')
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    if (!empId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
    }

    // Get employee's leave policy and policy name
    const employee = await prisma.$queryRaw`
      SELECT e.leaves_policy_id, e.emp_id, lp.leaves_policy_name
      FROM employee e
      LEFT JOIN leaves_policy lp ON e.leaves_policy_id = lp.id
      WHERE e.emp_id = ${empId}
      LIMIT 1
    ` as any[]

    if (employee.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const leavePolicyId = employee[0].leaves_policy_id
    const leavePolicyName = employee[0].leaves_policy_name || 'N/A'

    // Get allocated leaves for each type (status can be 1 or 2 based on DB data)
    const allocatedLeaves = await prisma.$queryRaw`
      SELECT
        ld.leave_type_id,
        lt.leave_type_name,
        ld.no_of_leaves as allocated
      FROM leaves_data ld
      LEFT JOIN leave_type lt ON ld.leave_type_id = lt.id
      WHERE ld.leaves_policy_id = ${leavePolicyId}
      AND ld.status IN (1, 2)
    ` as any[]

    // Get used leaves for selected year
    const usedLeaves = await prisma.$queryRaw`
      SELECT
        la.leave_type,
        SUM(lad.no_of_days) as used
      FROM leave_application la
      LEFT JOIN leave_application_data lad ON la.id = lad.leave_application_id
      WHERE la.emp_id = ${empId}
      AND la.approved = 1
      AND YEAR(STR_TO_DATE(lad.from_date, '%Y-%m-%d')) = ${year}
      GROUP BY la.leave_type
    ` as any[]

    // Combine allocated and used
    const balance = allocatedLeaves.map(allocated => {
      const used = usedLeaves.find(u => u.leave_type === allocated.leave_type_id)
      return {
        leaveTypeId: allocated.leave_type_id,
        leaveTypeName: allocated.leave_type_name,
        allocated: allocated.allocated || 0,
        used: used?.used || 0,
        remaining: (allocated.allocated || 0) - (used?.used || 0)
      }
    })

    return NextResponse.json({
      policyName: leavePolicyName,
      year: parseInt(year),
      balance: balance
    })
  } catch (error) {
    console.error('Error fetching leave balance:', error)
    return NextResponse.json({ error: 'Failed to fetch leave balance' }, { status: 500 })
  }
}
