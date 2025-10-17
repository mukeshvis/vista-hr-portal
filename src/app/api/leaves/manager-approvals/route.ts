import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

// GET - Fetch leave applications for employees reporting to a specific manager
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const managerId = searchParams.get('managerId') // This will be the emp_id of the manager

    if (!managerId) {
      return NextResponse.json({ error: 'Manager ID is required' }, { status: 400 })
    }

    // Fetch leave applications where the employee's reporting_manager matches the current manager
    // Include reporting manager name from employee table
    const query = `
      SELECT
        la.id,
        la.emp_id,
        e.emp_name as employee_name,
        lt.leave_type_name,
        la.leave_type as leave_type_id,
        la.leave_day_type,
        la.reason,
        la.leave_address,
        la.approval_status,
        la.approval_status_lm,
        la.approved,
        la.status,
        la.date as application_date,
        (SELECT from_date FROM leave_application_data WHERE leave_application_id = la.id LIMIT 1) as from_date,
        (SELECT to_date FROM leave_application_data WHERE leave_application_id = la.id LIMIT 1) as to_date,
        (SELECT no_of_days FROM leave_application_data WHERE leave_application_id = la.id LIMIT 1) as no_of_days,
        (SELECT first_second_half FROM leave_application_data WHERE leave_application_id = la.id LIMIT 1) as first_second_half,
        (SELECT first_second_half_date FROM leave_application_data WHERE leave_application_id = la.id LIMIT 1) as first_second_half_date,
        des.designation_name,
        dept.department_name,
        e.reporting_manager,
        mgr.emp_name as reporting_manager_name,
        mgr.emp_id as reporting_manager_id
      FROM leave_application la
      INNER JOIN employee e ON la.emp_id = e.emp_id
      LEFT JOIN employee mgr ON mgr.id = e.reporting_manager
      LEFT JOIN leave_type lt ON la.leave_type = lt.id
      LEFT JOIN designation des ON e.designation_id = des.id
      LEFT JOIN department dept ON e.emp_department_id = dept.id
      LEFT JOIN emp_empstatus es ON e.emp_employementstatus_id = es.id
      WHERE e.reporting_manager = ?
      AND LOWER(es.job_type_name) = 'permanent'
      AND la.status = 1
      ORDER BY
        CASE
          WHEN la.approval_status_lm = 0 THEN 0  -- Pending manager approval first
          WHEN la.approval_status_lm = 1 THEN 1  -- Manager approved second
          ELSE 2                                   -- Rejected last
        END,
        la.date DESC,
        la.id DESC
    `

    const applications = await prisma.$queryRawUnsafe(query, managerId) as any[]

    return NextResponse.json(applications)
  } catch (error) {
    console.error('Error fetching manager leave applications:', error)
    return NextResponse.json({ error: 'Failed to fetch leave applications' }, { status: 500 })
  }
}
