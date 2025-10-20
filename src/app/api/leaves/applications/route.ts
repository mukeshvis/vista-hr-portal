import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { transporter } from '@/lib/email/nodemailer'
import { generateLeaveApplicationEmail } from '@/lib/email/templates'
import { generateApprovalToken } from '@/lib/email/token'
import { getEmailBaseUrl } from '@/lib/utils/url'

// GET - Fetch all leave applications
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const empId = searchParams.get('empId')
    const status = searchParams.get('status')

    let query = `
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
        (SELECT emp_name FROM employee WHERE emp_id = e.reporting_manager LIMIT 1) as reporting_manager_name
      FROM leave_application la
      INNER JOIN employee e ON la.emp_id = e.emp_id
      LEFT JOIN leave_type lt ON la.leave_type = lt.id
      LEFT JOIN designation des ON e.designation_id = des.id
      LEFT JOIN department dept ON e.emp_department_id = dept.id
      LEFT JOIN emp_empstatus es ON e.emp_employementstatus_id = es.id
      WHERE 1=1
      AND LOWER(es.job_type_name) = 'permanent'
      AND la.date >= '2025-07-01'
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

    // Send email notifications
    try {
      console.log('📧 Sending email notifications...')

      // Fetch employee and manager details
      const employeeData = await prisma.$queryRaw`
        SELECT
          e.emp_id,
          e.emp_name,
          e.professional_email,
          e.reporting_manager,
          lt.leave_type_name,
          mgr.emp_name as manager_name,
          mgr.professional_email as manager_email
        FROM employee e
        LEFT JOIN leave_type lt ON lt.id = ${data.leaveType}
        LEFT JOIN employee mgr ON mgr.id = e.reporting_manager
        WHERE e.emp_id = ${data.empId}
        LIMIT 1
      ` as any[]

      console.log('📋 Employee data fetched:', JSON.stringify(employeeData, null, 2))

      if (employeeData && employeeData.length > 0) {
        const emp = employeeData[0]
        const baseUrl = getEmailBaseUrl()

        console.log(`🌐 Using base URL for emails: ${baseUrl} (APP_ENV: ${process.env.APP_ENV || 'local'})`)

        const emailData = {
          id: Number(leaveAppId),
          employeeName: emp.emp_name,
          employeeId: emp.emp_id,
          leaveType: emp.leave_type_name,
          fromDate: data.fromDate,
          toDate: data.toDate,
          numberOfDays: data.numberOfDays,
          reason: data.reason || 'No reason provided',
          applicationDate: new Date().toLocaleDateString('en-GB'),
          approvalToken: '',
        }

        const emails: Promise<any>[] = []

        // Send email to reporting manager (if exists)
        if (emp.reporting_manager && emp.manager_email) {
          console.log(`📧 Manager found - ID: ${emp.reporting_manager}, Email: ${emp.manager_email}`)

          const managerToken = generateApprovalToken({
            leaveApplicationId: Number(leaveAppId),
            role: 'manager',
          })

          // Generate and log approval URLs for testing
          const managerApproveUrl = `${baseUrl}/api/leaves/email-approval?token=${managerToken}&action=approve&role=manager`
          const managerRejectUrl = `${baseUrl}/api/leaves/email-approval?token=${managerToken}&action=reject&role=manager`

          console.log('\n🔗 ========== MANAGER APPROVAL LINKS ==========')
          console.log(`✅ APPROVE: ${managerApproveUrl}`)
          console.log(`❌ REJECT:  ${managerRejectUrl}`)
          console.log('============================================\n')

          emails.push(
            transporter.sendMail({
              from: process.env.SMTP_FROM,
              to: emp.manager_email,
              subject: `Leave Application from ${emp.emp_name} - Approval Required`,
              html: generateLeaveApplicationEmail(
                { ...emailData, approvalToken: managerToken },
                'manager',
                baseUrl
              ),
            })
          )

          console.log(`✉️ Manager email queued successfully: ${emp.manager_email}`)
        } else {
          console.log(`⚠️ No manager email found - reporting_manager: ${emp.reporting_manager}, manager_email: ${emp.manager_email}`)
        }

        // Send email to HR
        const hrEmail = process.env.HR_EMAIL || 'hr@vis.com.pk'
        const hrToken = generateApprovalToken({
          leaveApplicationId: Number(leaveAppId),
          role: 'hr',
        })

        // Generate and log approval URLs for testing
        const hrApproveUrl = `${baseUrl}/api/leaves/email-approval?token=${hrToken}&action=approve&role=hr`
        const hrRejectUrl = `${baseUrl}/api/leaves/email-approval?token=${hrToken}&action=reject&role=hr`

        console.log('\n🔗 ========== HR APPROVAL LINKS ==========')
        console.log(`✅ APPROVE: ${hrApproveUrl}`)
        console.log(`❌ REJECT:  ${hrRejectUrl}`)
        console.log('=========================================\n')

        emails.push(
          transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: hrEmail,
            subject: `Leave Application from ${emp.emp_name} - HR Review`,
            html: generateLeaveApplicationEmail(
              { ...emailData, approvalToken: hrToken },
              'hr',
              baseUrl
            ),
          })
        )

        console.log(`✉️ HR email queued: ${hrEmail}`)

        // Send all emails
        await Promise.all(emails)
        console.log('✅ All email notifications sent successfully!')
      }
    } catch (emailError) {
      console.error('❌ Failed to send email notifications:', emailError)
      // Don't fail the request if email sending fails
    }

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
