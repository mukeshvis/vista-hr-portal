import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

// GET - Fetch all leave applications
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const empId = searchParams.get('empId')
    const status = searchParams.get('status')

    let query = `
      SELECT DISTINCT
        la.id,
        la.emp_id,
        (SELECT emp_name FROM employee WHERE emp_id = la.emp_id LIMIT 1) as employee_name,
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
        lad.from_date,
        lad.to_date,
        lad.no_of_days,
        lad.first_second_half,
        lad.first_second_half_date,
        (SELECT designation_name FROM designation WHERE id = (SELECT designation_id FROM employee WHERE emp_id = la.emp_id LIMIT 1)) as designation_name,
        (SELECT department_name FROM department WHERE id = (SELECT emp_department_id FROM employee WHERE emp_id = la.emp_id LIMIT 1)) as department_name
      FROM leave_application la
      LEFT JOIN leave_type lt ON la.leave_type = lt.id
      LEFT JOIN leave_application_data lad ON la.id = lad.leave_application_id
      INNER JOIN employee e ON la.emp_id = e.emp_id
      LEFT JOIN emp_empstatus es ON e.emp_employementstatus_id = es.id
      WHERE 1=1
      AND LOWER(es.job_type_name) = 'permanent'
    `

    const params: any[] = []

    if (empId) {
      query += ` AND la.emp_id = ?`
      params.push(empId)
    }

    if (status) {
      query += ` AND la.approved = ?`
      params.push(parseInt(status))
    }

    query += ` ORDER BY la.date DESC, la.id DESC`

    const applications = await prisma.$queryRawUnsafe(query, ...params) as any[]

    return NextResponse.json(applications)
  } catch (error) {
    console.error('Error fetching leave applications:', error)
    return NextResponse.json({ error: 'Failed to fetch leave applications' }, { status: 500 })
  }
}

// POST - Create new leave application
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    console.log('📝 Creating leave application:', data)

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0]

    console.log('📅 Date/Time:', { dateStr, timeStr })

    // Fetch employee's leave policy ID
    console.log('🔍 Fetching employee leave policy...')
    const employee = await prisma.$queryRaw`
      SELECT leaves_policy_id FROM employee WHERE emp_id = ${data.empId} LIMIT 1
    ` as any[]

    const leavePolicyId = employee[0]?.leaves_policy_id || 1
    console.log('📋 Employee leave policy ID:', leavePolicyId)

    // Insert leave application
    console.log('🔄 Inserting leave application...')
    const insertResult = await prisma.$executeRaw`
      INSERT INTO leave_application (
        emp_id, company_id, leave_policy_id, leave_type, leave_day_type,
        reason, leave_address, approval_status, approved, approval_status_lm,
        status, username, date, time
      ) VALUES (
        ${data.empId}, ${data.companyId || 1}, ${leavePolicyId},
        ${data.leaveType}, ${data.leaveDayType.toString()},
        ${data.reason}, ${data.leaveAddress || 'N/A'},
        0, 0, 0, 1,
        ${data.username || 'system'}, ${dateStr}, ${timeStr}
      )
    `

    console.log('✅ Leave application inserted:', insertResult)

    // Get the inserted ID
    const result = await prisma.$queryRaw`SELECT LAST_INSERT_ID() as id` as any[]
    const leaveAppId = result[0].id

    console.log('📋 Inserting leave application data with ID:', leaveAppId)

    // Insert leave application data - complete schema with all required columns
    await prisma.$executeRaw`
      INSERT INTO leave_application_data (
        leave_policy_id,
        emp_id,
        leave_application_id,
        leave_type,
        leave_day_type,
        no_of_days,
        from_date,
        to_date,
        date_of_return_to_work,
        first_second_half,
        first_second_half_date,
        status,
        username,
        date,
        time
      ) VALUES (
        ${leavePolicyId},
        ${data.empIdNum || 0},
        ${Number(leaveAppId)},
        ${data.leaveType},
        ${data.leaveDayType},
        ${data.numberOfDays},
        ${data.fromDate},
        ${data.toDate},
        ${data.returnDate || data.toDate},
        ${data.halfDayType || ''},
        ${data.halfDayDate || ''},
        1,
        ${data.username || 'system'},
        ${dateStr},
        ${timeStr}
      )
    `

    console.log('✅ Leave application created successfully!')

    return NextResponse.json({
      success: true,
      message: 'Leave application submitted successfully',
      id: Number(leaveAppId)
    })
  } catch (error: any) {
    console.error('❌ Error creating leave application:', error)
    console.error('Error details:', error.message)
    return NextResponse.json({
      error: 'Failed to create leave application',
      details: error.message
    }, { status: 500 })
  }
}
