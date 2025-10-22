import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

// Smart Rounding Function
// Rules:
// - Exactly 0.5 → Keep as 0.5 (e.g., 12.5 stays 12.5)
// - >= 0.6 → Round UP (e.g., 6.67 → 7)
// - < 0.5 → Round DOWN (e.g., 5.33 → 5)
function smartRounding(value: number): number {
  const integer = Math.floor(value)
  const decimal = value - integer

  if (decimal === 0.5) {
    return value // Keep exactly 0.5
  } else if (decimal >= 0.6) {
    return Math.ceil(value) // Round up
  } else if (decimal < 0.5) {
    return Math.floor(value) // Round down
  } else {
    // For values between 0.5 and 0.6, round to nearest 0.5
    return Math.round(value * 2) / 2
  }
}

// Calculate prorated leaves based on permanent/confirmation date
function calculateProratedLeaves(
  permanentDate: Date | null,
  leaveYearStart: Date,
  leaveYearEnd: Date,
  totalLeaves: number
): number {
  // If no permanent date, return full leaves
  if (!permanentDate) {
    return totalLeaves
  }

  // Check if permanent date is within the current leave year
  if (permanentDate < leaveYearStart) {
    // Employee was permanent before this leave year started, give full leaves
    return totalLeaves
  }

  if (permanentDate > leaveYearEnd) {
    // Employee will become permanent after this leave year, no leaves
    return 0
  }

  // Calculate remaining months from permanent date to leave year end
  const permanentMonth = permanentDate.getMonth()
  const permanentYear = permanentDate.getFullYear()
  const endMonth = leaveYearEnd.getMonth()
  const endYear = leaveYearEnd.getFullYear()

  // Calculate months difference
  let remainingMonths = (endYear - permanentYear) * 12 + (endMonth - permanentMonth) + 1

  // Prorate the leaves
  const proratedLeaves = (remainingMonths / 12) * totalLeaves

  console.log(`📊 Prorated Calculation: ${remainingMonths} months / 12 × ${totalLeaves} = ${proratedLeaves}`)

  return smartRounding(proratedLeaves)
}

export async function GET(request: NextRequest) {
  try {
    // Get year from query params, default to current year
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    const yearNum = parseInt(year)

    // Calculate leave year (July to June)
    const leaveYearStart = new Date(`${yearNum}-07-01`)
    const leaveYearEnd = new Date(`${yearNum + 1}-06-30`)
    const fromDate = `${yearNum}-07-01`

    console.log(`🔄 Fetching employee balances for leave year: ${fromDate} to ${yearNum + 1}-06-30`)

    // First, try to get basic employee data
    const employeesBalance = await prisma.$queryRaw`
      SELECT
        e.emp_id,
        e.emp_name as employee_name,
        e.date_of_confirmation as permanent_date,
        COALESCE(d.department_name, 'N/A') as department_name,
        COALESCE(des.designation_name, 'N/A') as designation_name,
        e.leaves_policy_id,
        e.reporting_manager,
        COALESCE(
          (SELECT MAX(no_of_leaves)
           FROM leaves_data
           WHERE leaves_policy_id = e.leaves_policy_id
           AND status IN (1, 2)
          ), 40
        ) as policy_leaves,
        COALESCE(
          (SELECT SUM(lad.no_of_days)
           FROM leave_application la
           LEFT JOIN leave_application_data lad ON la.id = lad.leave_application_id
           WHERE la.emp_id = e.emp_id
           AND la.approved = 1
           AND STR_TO_DATE(lad.from_date, '%Y-%m-%d') >= ${fromDate}
          ), 0
        ) as total_used,
        COALESCE(
          (SELECT COUNT(*)
           FROM leave_application la
           WHERE la.emp_id = e.emp_id
          ), 0
        ) as total_applications,
        COALESCE(
          (SELECT SUM(lad.no_of_days)
           FROM leave_application la
           LEFT JOIN leave_application_data lad ON la.id = lad.leave_application_id
           LEFT JOIN leave_type lt ON la.leave_type = lt.id
           WHERE la.emp_id = e.emp_id
           AND la.approved = 1
           AND LOWER(lt.leave_type_name) LIKE '%annual%'
           AND STR_TO_DATE(lad.from_date, '%Y-%m-%d') >= ${fromDate}
          ), 0
        ) as annual_used,
        COALESCE(
          (SELECT SUM(lad.no_of_days)
           FROM leave_application la
           LEFT JOIN leave_application_data lad ON la.id = lad.leave_application_id
           LEFT JOIN leave_type lt ON la.leave_type = lt.id
           WHERE la.emp_id = e.emp_id
           AND la.approved = 1
           AND LOWER(lt.leave_type_name) LIKE '%sick%'
           AND STR_TO_DATE(lad.from_date, '%Y-%m-%d') >= ${fromDate}
          ), 0
        ) as sick_used,
        COALESCE(
          (SELECT SUM(lad.no_of_days)
           FROM leave_application la
           LEFT JOIN leave_application_data lad ON la.id = lad.leave_application_id
           LEFT JOIN leave_type lt ON la.leave_type = lt.id
           WHERE la.emp_id = e.emp_id
           AND la.approved = 1
           AND LOWER(lt.leave_type_name) LIKE '%emergency%'
           AND STR_TO_DATE(lad.from_date, '%Y-%m-%d') >= ${fromDate}
          ), 0
        ) as emergency_used
      FROM employee e
      LEFT JOIN department d ON e.emp_department_id = d.id
      LEFT JOIN designation des ON e.designation_id = des.id
      LEFT JOIN emp_empstatus es ON e.emp_employementstatus_id = es.id
      WHERE e.status = 1
      AND e.emp_id IS NOT NULL
      AND e.emp_id != ''
      AND (es.job_type_name IS NULL OR LOWER(es.job_type_name) = 'permanent')
      ORDER BY e.emp_name ASC
    ` as any[]

    // Get manager names by matching reporting_manager IDs
    const managerIds = [...new Set(employeesBalance.map(emp => emp.reporting_manager).filter(Boolean))]
    let managerMap = new Map()

    if (managerIds.length > 0) {
      const managerIdsList = managerIds.join(',')
      const managers = await prisma.$queryRawUnsafe(`
        SELECT id, emp_name FROM employee WHERE id IN (${managerIdsList})
      `) as any[]

      managerMap = new Map(managers.map((m: any) => [Number(m.id), m.emp_name]))
    }

    // Calculate prorated leaves for each employee based on permanent date
    const result = employeesBalance.map(emp => {
      try {
        const policyLeaves = Number(emp.policy_leaves) || 40
        let permanentDate: Date | null = null

        // Safely parse permanent date
        if (emp.permanent_date) {
          try {
            permanentDate = new Date(emp.permanent_date)
            // Check if date is valid
            if (isNaN(permanentDate.getTime())) {
              permanentDate = null
            }
          } catch (e) {
            console.warn(`⚠️  Invalid date for ${emp.employee_name}: ${emp.permanent_date}`)
            permanentDate = null
          }
        }

        // Calculate prorated leaves based on permanent date
        const totalAllocated = calculateProratedLeaves(
          permanentDate,
          leaveYearStart,
          leaveYearEnd,
          policyLeaves
        )

        const totalUsed = Number(emp.total_used) || 0
        const totalRemaining = totalAllocated - totalUsed

        console.log(`👤 ${emp.employee_name}: Policy=${policyLeaves}, Permanent=${permanentDate?.toISOString().split('T')[0] || 'null'}, Allocated=${totalAllocated}`)

        return {
          emp_id: emp.emp_id,
          employee_name: emp.employee_name,
          department_name: emp.department_name || 'N/A',
          designation_name: emp.designation_name || 'N/A',
          manager_name: managerMap.get(Number(emp.reporting_manager)) || 'N/A',
          total_allocated: totalAllocated,
          total_used: totalUsed,
          total_remaining: totalRemaining,
          total_applications: Number(emp.total_applications) || 0,
          annual_used: Number(emp.annual_used) || 0,
          sick_used: Number(emp.sick_used) || 0,
          emergency_used: Number(emp.emergency_used) || 0
        }
      } catch (error) {
        console.error(`❌ Error processing employee ${emp.employee_name}:`, error)
        // Return safe default values
        return {
          emp_id: emp.emp_id,
          employee_name: emp.employee_name,
          department_name: emp.department_name || 'N/A',
          designation_name: emp.designation_name || 'N/A',
          manager_name: managerMap.get(Number(emp.reporting_manager)) || 'N/A',
          total_allocated: 40,
          total_used: 0,
          total_remaining: 40,
          total_applications: 0,
          annual_used: 0,
          sick_used: 0,
          emergency_used: 0
        }
      }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ Error fetching employees balance:', error)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error stack:', error.stack)

    // Return detailed error for debugging
    return NextResponse.json({
      error: 'Failed to fetch employees balance',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      code: error.code
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { empId, totalAllocated } = body

    console.log('🔄 Manual override: Updating leave balance for employee:', empId, 'to:', totalAllocated)
    console.log('⚠️  Note: This will override any automatic prorated calculation based on permanent date')

    if (!empId || totalAllocated === undefined || totalAllocated === null) {
      return NextResponse.json({
        error: 'Employee ID and total allocated leaves are required'
      }, { status: 400 })
    }

    // Validate that totalAllocated is a valid number
    const allocatedLeaves = Number(totalAllocated)
    if (isNaN(allocatedLeaves) || allocatedLeaves < 0) {
      return NextResponse.json({
        error: 'Total allocated leaves must be a valid non-negative number'
      }, { status: 400 })
    }

    // Get the employee's current leave policy ID and internal ID
    const employee = await prisma.$queryRaw`
      SELECT id, leaves_policy_id, emp_name
      FROM employee
      WHERE emp_id = ${empId}
      LIMIT 1
    ` as any[]

    if (!employee || employee.length === 0) {
      return NextResponse.json({
        error: 'Employee not found'
      }, { status: 404 })
    }

    const employeeInternalId = employee[0].id
    const currentLeavePolicyId = employee[0].leaves_policy_id
    const empName = employee[0].emp_name

    if (!currentLeavePolicyId) {
      return NextResponse.json({
        error: 'Employee does not have a leave policy assigned'
      }, { status: 400 })
    }

    console.log('📋 Current leave policy ID:', currentLeavePolicyId)

    // Check how many employees share this leave policy
    const employeesWithSamePolicy = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM employee
      WHERE leaves_policy_id = ${currentLeavePolicyId}
      AND status = 1
    ` as any[]

    const sharedPolicyCount = Number(employeesWithSamePolicy[0].count)
    console.log('👥 Employees sharing this policy:', sharedPolicyCount)

    let targetPolicyId = currentLeavePolicyId

    // If this policy is shared by multiple employees, create a new unique policy for this employee
    if (sharedPolicyCount > 1) {
      console.log('🆕 Creating new unique leave policy for employee:', empName)

      // Get the original policy name
      const originalPolicy = await prisma.$queryRaw`
        SELECT leaves_policy_name
        FROM leaves_policy
        WHERE id = ${currentLeavePolicyId}
        LIMIT 1
      ` as any[]

      const originalPolicyName = originalPolicy[0]?.leaves_policy_name || 'Default Policy'
      const newPolicyName = `${originalPolicyName} - ${empName} (Custom)`

      // Create new leave policy
      await prisma.$executeRaw`
        INSERT INTO leaves_policy (leaves_policy_name, status, username, date, time)
        VALUES (
          ${newPolicyName},
          1,
          'admin',
          ${new Date().toISOString().split('T')[0]},
          ${new Date().toTimeString().split(' ')[0]}
        )
      `

      // Get the newly created policy ID
      const newPolicy = await prisma.$queryRaw`
        SELECT id FROM leaves_policy
        WHERE leaves_policy_name = ${newPolicyName}
        ORDER BY id DESC
        LIMIT 1
      ` as any[]

      targetPolicyId = newPolicy[0].id
      console.log('✅ Created new policy with ID:', targetPolicyId)

      // Copy all leave types from the original policy to the new policy
      const originalLeaveData = await prisma.$queryRaw`
        SELECT leave_type_id, no_of_leaves, status
        FROM leaves_data
        WHERE leaves_policy_id = ${currentLeavePolicyId}
      ` as any[]

      // Insert leave data for the new policy
      for (const leaveType of originalLeaveData) {
        await prisma.$executeRaw`
          INSERT INTO leaves_data (leaves_policy_id, leave_type_id, no_of_leaves, status, date, time, username)
          VALUES (
            ${targetPolicyId},
            ${leaveType.leave_type_id},
            ${leaveType.no_of_leaves},
            ${leaveType.status},
            ${new Date().toISOString().split('T')[0]},
            ${new Date().toTimeString().split(' ')[0]},
            'admin'
          )
        `
      }

      // Update employee to use the new policy
      await prisma.$executeRaw`
        UPDATE employee
        SET leaves_policy_id = ${targetPolicyId}
        WHERE id = ${employeeInternalId}
      `

      console.log('✅ Copied leave types and updated employee to new policy')
    }

    // Now update the leave allocation for this specific policy
    await prisma.$executeRaw`
      UPDATE leaves_data
      SET no_of_leaves = ${allocatedLeaves}
      WHERE leaves_policy_id = ${targetPolicyId}
      AND status IN (1, 2)
    `

    console.log('✅ Updated leave balance to:', allocatedLeaves)

    return NextResponse.json({
      success: true,
      message: `Leave balance manually updated to ${allocatedLeaves} for ${empName}`,
      empId,
      totalAllocated: allocatedLeaves,
      policyId: targetPolicyId,
      wasShared: sharedPolicyCount > 1,
      note: 'Manual override applied - automatic prorated calculation bypassed'
    })
  } catch (error: any) {
    console.error('Error updating employee leave balance:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json({
      error: 'Failed to update employee leave balance',
      details: error.message
    }, { status: 500 })
  }
}
