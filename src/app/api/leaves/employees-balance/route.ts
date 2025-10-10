import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

export async function GET() {
  try {
    // Get all employees with their leave balance information
    const employeesBalance = await prisma.$queryRaw`
      SELECT
        e.emp_id,
        e.emp_name as employee_name,
        d.department_name,
        des.designation_name,
        e.leaves_policy_id,
        e.reporting_manager,
        COALESCE(SUM(ld.no_of_leaves), 0) as total_allocated,
        COALESCE(
          (SELECT SUM(lad.no_of_days)
           FROM leave_application la
           LEFT JOIN leave_application_data lad ON la.id = lad.leave_application_id
           WHERE la.emp_id = e.emp_id
           AND la.approved = 1
           AND YEAR(STR_TO_DATE(lad.from_date, '%Y-%m-%d')) = YEAR(CURDATE())
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
           AND YEAR(STR_TO_DATE(lad.from_date, '%Y-%m-%d')) = YEAR(CURDATE())
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
           AND YEAR(STR_TO_DATE(lad.from_date, '%Y-%m-%d')) = YEAR(CURDATE())
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
           AND YEAR(STR_TO_DATE(lad.from_date, '%Y-%m-%d')) = YEAR(CURDATE())
          ), 0
        ) as emergency_used
      FROM employee e
      LEFT JOIN department d ON e.emp_department_id = d.id
      LEFT JOIN designation des ON e.designation_id = des.id
      LEFT JOIN leaves_data ld ON e.leaves_policy_id = ld.leaves_policy_id AND ld.status IN (1, 2)
      WHERE e.status = 1 AND e.emp_id IS NOT NULL AND e.emp_id != ''
      GROUP BY e.emp_id, e.emp_name, d.department_name, des.designation_name, e.leaves_policy_id, e.reporting_manager
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

    // Calculate remaining leaves for each employee
    const result = employeesBalance.map(emp => ({
      emp_id: emp.emp_id,
      employee_name: emp.employee_name,
      department_name: emp.department_name || 'N/A',
      designation_name: emp.designation_name || 'N/A',
      manager_name: managerMap.get(Number(emp.reporting_manager)) || 'N/A',
      total_allocated: Number(emp.total_allocated) || 0,
      total_used: Number(emp.total_used) || 0,
      total_remaining: (Number(emp.total_allocated) || 0) - (Number(emp.total_used) || 0),
      total_applications: Number(emp.total_applications) || 0,
      annual_used: Number(emp.annual_used) || 0,
      sick_used: Number(emp.sick_used) || 0,
      emergency_used: Number(emp.emergency_used) || 0
    }))

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching employees balance:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json({
      error: 'Failed to fetch employees balance',
      details: error.message
    }, { status: 500 })
  }
}
