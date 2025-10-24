import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { verifyApprovalToken } from '@/lib/email/token'
import { transporter } from '@/lib/email/nodemailer'
import { generateRemoteWorkApprovalNotificationEmail } from '@/lib/email/remote-work-templates'
import { getEmailBaseUrl } from '@/lib/utils/url'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const action = searchParams.get('action') // 'approve' or 'reject'
    const role = searchParams.get('role') // 'manager' or 'hr'

    // Get the base URL based on environment
    const baseUrl = getEmailBaseUrl()
    console.log(`🔗 Base URL for redirect: ${baseUrl} (APP_ENV: ${process.env.APP_ENV || 'local'})`)

    if (!token || !action || !role) {
      const errorRedirectUrl = new URL('/leaves', baseUrl)
      errorRedirectUrl.searchParams.set('notification', 'error')
      errorRedirectUrl.searchParams.set('message', 'Missing required parameters')
      console.log('❌ Missing parameters, redirecting to:', errorRedirectUrl.toString())
      return NextResponse.redirect(errorRedirectUrl.toString())
    }

    // Verify token
    const tokenData = verifyApprovalToken(token)
    if (!tokenData.valid) {
      const errorRedirectUrl = new URL('/leaves', baseUrl)
      errorRedirectUrl.searchParams.set('notification', 'error')
      errorRedirectUrl.searchParams.set('message', tokenData.error || 'Invalid or expired token')
      console.log('❌ Invalid token, redirecting to:', errorRedirectUrl.toString())
      return NextResponse.redirect(errorRedirectUrl.toString())
    }

    const { id: remoteWorkId } = tokenData.data!

    // Validate role matches token
    if (tokenData.data!.role !== role) {
      const errorRedirectUrl = new URL('/leaves', baseUrl)
      errorRedirectUrl.searchParams.set('notification', 'error')
      errorRedirectUrl.searchParams.set('message', 'Invalid role for this token')
      console.log('❌ Invalid role, redirecting to:', errorRedirectUrl.toString())
      return NextResponse.redirect(errorRedirectUrl.toString())
    }

    // Fetch remote work application details
    const remoteAppResult = await prisma.$queryRaw`
      SELECT
        ra.*,
        e.emp_name as employee_name,
        e.professional_email as employee_email,
        e.reporting_manager,
        (SELECT emp_name FROM employee WHERE emp_id = e.reporting_manager LIMIT 1) as manager_name,
        (SELECT professional_email FROM employee WHERE emp_id = e.reporting_manager LIMIT 1) as manager_email
      FROM remote_application ra
      INNER JOIN employee e ON ra.emp_id = e.emp_id
      WHERE ra.id = ${remoteWorkId}
      LIMIT 1
    ` as any[]

    if (!remoteAppResult || remoteAppResult.length === 0) {
      const errorRedirectUrl = new URL('/leaves', baseUrl)
      errorRedirectUrl.searchParams.set('notification', 'error')
      errorRedirectUrl.searchParams.set('message', 'Remote work application not found')
      console.log('❌ Remote work application not found, redirecting to:', errorRedirectUrl.toString())
      return NextResponse.redirect(errorRedirectUrl.toString())
    }

    const remoteApp = remoteAppResult[0]
    const isApprove = action === 'approve'
    const statusValue = isApprove ? 'Approved' : 'Rejected'
    const approvedValue = isApprove ? 1 : 2

    // Check if already processed
    if (remoteApp.approval_status !== 'Pending') {
      const errorRedirectUrl = new URL('/leaves', baseUrl)
      errorRedirectUrl.searchParams.set('notification', 'error')
      errorRedirectUrl.searchParams.set('message', `This remote work application has already been ${remoteApp.approval_status.toLowerCase()}`)
      console.log('❌ Already processed, redirecting to:', errorRedirectUrl.toString())
      return NextResponse.redirect(errorRedirectUrl.toString())
    }

    // Update approval status
    await prisma.$executeRaw`
      UPDATE remote_application
      SET
        approval_status = ${statusValue},
        approved = ${approvedValue},
        approved_by = ${role === 'manager' ? remoteApp.manager_name || 'Manager' : 'HR Department'},
        approved_date = NOW()
      WHERE id = ${remoteWorkId}
    `

    // Send notification email to employee
    const employeeEmail = remoteApp.employee_email || remoteApp.emp_id + '@vis.com.pk'

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: employeeEmail,
        subject: `Remote Work Application ${isApprove ? 'Approved' : 'Rejected'} by ${role === 'manager' ? 'Manager' : 'HR'}`,
        html: generateRemoteWorkApprovalNotificationEmail({
          employeeName: remoteApp.employee_name,
          employeeId: remoteApp.emp_id,
          fromDate: remoteApp.from_date,
          toDate: remoteApp.to_date,
          numberOfDays: remoteApp.number_of_days,
          status: isApprove ? 'approved' : 'rejected',
          approvedBy: role === 'manager' ? (remoteApp.manager_name || 'Reporting Manager') : 'HR Department',
          role: role === 'manager' ? 'Reporting Manager' : 'HR Department',
        }),
      })
      console.log('✅ Notification email sent to employee:', employeeEmail)
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError)
    }

    // Redirect to portal with notification
    const successRedirectUrl = new URL('/leaves', baseUrl)
    successRedirectUrl.searchParams.set('notification', 'success')
    successRedirectUrl.searchParams.set('action', isApprove ? 'approved' : 'rejected')
    successRedirectUrl.searchParams.set('type', 'remote')
    successRedirectUrl.searchParams.set('role', role)
    successRedirectUrl.searchParams.set('employee', remoteApp.employee_name)
    console.log('✅ Remote work approval successful, redirecting to:', successRedirectUrl.toString())
    return NextResponse.redirect(successRedirectUrl.toString())

  } catch (error) {
    console.error('❌ Error processing remote work email approval:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const errorRedirectUrl = new URL('/leaves', baseUrl)
    errorRedirectUrl.searchParams.set('notification', 'error')
    errorRedirectUrl.searchParams.set('message', 'An error occurred while processing your request')
    console.log('❌ Exception caught, redirecting to:', errorRedirectUrl.toString())
    return NextResponse.redirect(errorRedirectUrl.toString())
  }
}
