import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

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
    const searchParams = request.nextUrl.searchParams
    const empId = searchParams.get('empId')
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    if (!empId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
    }

    // Get employee's leave policy, policy name, and date_of_confirmation
    const employee = await prisma.$queryRaw`
      SELECT e.leaves_policy_id, e.emp_id, lp.leaves_policy_name, e.date_of_confirmation
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
    const dateOfConfirmation = employee[0].date_of_confirmation

    // Calculate prorated leaves based on date_of_confirmation
    const yearNum = parseInt(year)
    const proratedLeaves = calculateProratedLeaves(dateOfConfirmation, yearNum)

    console.log(`👤 Employee: ${empId}`)
    console.log(`   - Confirmation date: ${dateOfConfirmation || 'N/A'}`)
    console.log(`   - Prorated: ${proratedLeaves.isProrated ? 'Yes' : 'No'}`)
    console.log(`   - Allocated leaves: Annual=${proratedLeaves.annual}, Sick=${proratedLeaves.sick}, Emergency=${proratedLeaves.emergency}`)

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

    // Apply prorated allocation per leave type
    const correctedAllocations = allocatedLeaves.map((allocated: any) => {
      const leaveTypeName = allocated.leave_type_name?.toLowerCase() || ''
      let correctAllocation = allocated.allocated

      // Use prorated leaves calculated from date_of_confirmation
      if (leaveTypeName.includes('annual')) {
        correctAllocation = proratedLeaves.annual
      } else if (leaveTypeName.includes('sick')) {
        correctAllocation = proratedLeaves.sick
      } else if (leaveTypeName.includes('emergency')) {
        correctAllocation = proratedLeaves.emergency
      }

      return {
        ...allocated,
        allocated: correctAllocation
      }
    })

    console.log('✅ Prorated allocations:', correctedAllocations)

    // Get used leaves for selected year (using July-based leave year)
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
