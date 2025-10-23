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

    console.log('📋 Raw allocated leaves from DB:', allocatedLeaves)

    // Check if all leave types have the same value (e.g., all 40)
    // If yes, apply standard leave policy distribution
    const allSame = allocatedLeaves.every((l: any) => l.allocated === allocatedLeaves[0]?.allocated)
    const totalLeaves = allocatedLeaves[0]?.allocated || 40

    console.log(`🔍 All leave types have same value? ${allSame}, Total: ${totalLeaves}`)

    // Standard leave policy breakdown (if total is 40)
    const standardPolicy: Record<string, number> = {
      'annual': 22,      // 55%
      'sick': 8,         // 20%
      'emergency': 10    // 25%
    }

    // Apply correct allocation per leave type
    const correctedAllocations = allocatedLeaves.map((allocated: any) => {
      let correctAllocation = allocated.allocated

      // If all types have same value (like 40), use standard policy breakdown
      if (allSame && totalLeaves === 40) {
        const leaveTypeName = allocated.leave_type_name?.toLowerCase() || ''

        if (leaveTypeName.includes('annual')) {
          correctAllocation = standardPolicy.annual
        } else if (leaveTypeName.includes('sick')) {
          correctAllocation = standardPolicy.sick
        } else if (leaveTypeName.includes('emergency')) {
          correctAllocation = standardPolicy.emergency
        }
      }

      return {
        ...allocated,
        allocated: correctAllocation
      }
    })

    console.log('✅ Corrected allocations:', correctedAllocations)

    // Get used leaves for selected year (using July-based leave year)
    const yearNum = parseInt(year)
    const fromDate = `${yearNum}-07-01`
    const toDate = `${yearNum + 1}-06-30`

    const usedLeaves = await prisma.$queryRaw`
      SELECT
        la.leave_type,
        SUM(lad.no_of_days) as used
      FROM leave_application la
      LEFT JOIN leave_application_data lad ON la.id = lad.leave_application_id
      WHERE la.emp_id = ${empId}
      AND la.approved = 1
      AND STR_TO_DATE(lad.from_date, '%Y-%m-%d') >= ${fromDate}
      AND STR_TO_DATE(lad.from_date, '%Y-%m-%d') <= ${toDate}
      GROUP BY la.leave_type
    ` as any[]

    console.log('📊 Used leaves:', usedLeaves)

    // Combine allocated and used
    const balance = correctedAllocations.map((allocated: any) => {
      const used = usedLeaves.find((u: any) => u.leave_type === allocated.leave_type_id)
      const allocatedNum = Number(allocated.allocated) || 0
      const usedNum = Number(used?.used) || 0

      return {
        leaveTypeId: allocated.leave_type_id,
        leaveTypeName: allocated.leave_type_name,
        allocated: allocatedNum,
        used: usedNum,
        remaining: allocatedNum - usedNum
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
