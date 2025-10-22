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

    // Simple query - just get basic employee data first
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
      WHERE e.status = 1
      AND e.emp_id IS NOT NULL
      AND e.emp_id != ''
      ORDER BY e.emp_name ASC
      LIMIT 100
    ` as any[]

    console.log(`✅ Found ${employees.length} employees`)

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

    // Build result with default 40 leaves for everyone
    const result = employees.map((emp: any) => ({
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
    }))

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
