import { NextRequest, NextResponse } from 'next/server'
import { prisma, executeWithRetry } from '@/lib/database/prisma'

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
        m.emp_name as manager_name,
        m.emp_id as manager_emp_id
      FROM employee e
      LEFT JOIN employee m ON e.reporting_manager = m.id
      LEFT JOIN emp_empstatus es ON e.emp_employementstatus_id = es.id
      WHERE e.status = 1
        AND e.emp_id IS NOT NULL
        AND e.emp_id != ''
        AND LOWER(es.job_type_name) = 'permanent'
      ORDER BY e.emp_name ASC
    `

    const employees = await executeWithRetry(async () => {
      return await prisma.$queryRawUnsafe(query) as any[]
    })

    console.log(`✅ Fetched ${employees.length} permanent employees (probation employees excluded)`)

    // Log first few employees to verify manager data
    if (employees.length > 0) {
      console.log('📋 Sample employees with managers:')
      employees.slice(0, 5).forEach(emp => {
        console.log(`  👤 ${emp.emp_name} (EmpID: ${emp.emp_id})`)
        console.log(`     └─ Manager: ${emp.manager_name || 'N/A'} (Manager ID: ${emp.manager_id || 'N/A'}, Manager EmpID: ${emp.manager_emp_id || 'N/A'})`)
      })
    }

    return NextResponse.json(employees)
  } catch (error) {
    console.error('❌ Error fetching employees:', error)
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}
