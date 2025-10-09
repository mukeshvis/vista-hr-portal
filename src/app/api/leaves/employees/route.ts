import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

// GET - Fetch all active employees with their manager info
export async function GET(request: NextRequest) {
  try {
    const query = `
      SELECT
        e.id,
        e.emp_id,
        e.emp_name,
        e.leaves_policy_id,
        e.reporting_manager as manager_id,
        m.emp_name as manager_name
      FROM employee e
      LEFT JOIN employee m ON e.reporting_manager = m.emp_id
      WHERE e.active = 1
        AND e.emp_id IS NOT NULL
        AND e.emp_id != ''
      ORDER BY e.emp_name ASC
    `

    const employees = await prisma.$queryRawUnsafe(query) as any[]

    console.log(`✅ Fetched ${employees.length} employees`)

    // Log first few employees to verify manager data
    if (employees.length > 0) {
      console.log('Sample employees with managers:')
      employees.slice(0, 3).forEach(emp => {
        console.log(`  - ${emp.emp_name} (${emp.emp_id}) → Manager: ${emp.manager_name || 'N/A'} (${emp.manager_id || 'N/A'})`)
      })
    }

    return NextResponse.json(employees)
  } catch (error) {
    console.error('❌ Error fetching employees:', error)
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}
