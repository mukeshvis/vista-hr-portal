import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

// GET - Fetch remote work applications for employees reporting to a specific manager
// If managerId not provided, returns ALL applications that have reporting managers (for HR view)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const managerId = searchParams.get('managerId') // Optional - if not provided, returns all

    // Base query for all manager-level approvals
    let query = `
      SELECT
        ra.id,
        ra.emp_id,
        ra.employee_name,
        ra.from_date,
        ra.to_date,
        ra.number_of_days,
        ra.date,
        ra.reason,
        ra.approval_status,
        ra.approved,
        ra.approved_by,
        ra.approved_date,
        ra.rejection_reason,
        ra.manager_id,
        ra.manager_name,
        ra.application_date,
        ra.status,
        e.reporting_manager,
        mgr.emp_name as reporting_manager_name,
        mgr.emp_id as reporting_manager_id,
        des.designation_name,
        dept.department_name
      FROM remote_application ra
      INNER JOIN employee e ON ra.emp_id = e.emp_id
      LEFT JOIN employee mgr ON mgr.id = e.reporting_manager
      LEFT JOIN designation des ON e.designation_id = des.id
      LEFT JOIN department dept ON e.emp_department_id = dept.id
      LEFT JOIN emp_empstatus es ON e.emp_employementstatus_id = es.id
      WHERE e.reporting_manager IS NOT NULL
      AND LOWER(es.job_type_name) = 'permanent'
      AND ra.status = 1
    `

    const params: any[] = []

    // If managerId provided, filter by that specific manager
    if (managerId) {
      query += ` AND e.reporting_manager = ?`
      params.push(managerId)
    }

    query += `
      ORDER BY
        CASE
          WHEN ra.approval_status = 'Pending' THEN 0  -- Pending approvals first
          WHEN ra.approval_status = 'Approved' THEN 1  -- Approved second
          ELSE 2                                        -- Rejected last
        END,
        ra.application_date DESC,
        ra.id DESC
    `

    const applications = await prisma.$queryRawUnsafe(query, ...params) as any[]

    console.log(`📊 Fetched ${applications.length} manager remote work applications${managerId ? ` for manager ${managerId}` : ' (all managers)'}`)

    return NextResponse.json(applications)
  } catch (error) {
    console.error('Error fetching manager remote work applications:', error)
    return NextResponse.json({ error: 'Failed to fetch remote work applications' }, { status: 500 })
  }
}
