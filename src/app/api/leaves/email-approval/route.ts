import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { verifyApprovalToken } from '@/lib/email/token'
import { transporter } from '@/lib/email/nodemailer'
import { generateApprovalNotificationEmail } from '@/lib/email/templates'
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

    const { id: leaveApplicationId } = tokenData.data!

    // Validate role matches token
    if (tokenData.data!.role !== role) {
      const errorRedirectUrl = new URL('/leaves', baseUrl)
      errorRedirectUrl.searchParams.set('notification', 'error')
      errorRedirectUrl.searchParams.set('message', 'Invalid role for this token')
      console.log('❌ Invalid role, redirecting to:', errorRedirectUrl.toString())
      return NextResponse.redirect(errorRedirectUrl.toString())
    }

    // Fetch leave application details
    const leaveApp = await prisma.$queryRaw`
      SELECT
        la.*,
        e.emp_name as employee_name,
        e.professional_email as employee_email,
        e.reporting_manager,
        lt.leave_type_name,
        lad.from_date,
        lad.to_date,
        lad.no_of_days,
        (SELECT emp_name FROM employee WHERE emp_id = e.reporting_manager LIMIT 1) as manager_name,
        (SELECT professional_email FROM employee WHERE emp_id = e.reporting_manager LIMIT 1) as manager_email
      FROM leave_application la
      INNER JOIN employee e ON la.emp_id = e.emp_id
      LEFT JOIN leave_type lt ON la.leave_type = lt.id
      LEFT JOIN leave_application_data lad ON la.id = lad.leave_application_id
      WHERE la.id = ${leaveApplicationId}
      LIMIT 1
    ` as any[]

    if (!leaveApp || leaveApp.length === 0) {
      const errorRedirectUrl = new URL('/leaves', baseUrl)
      errorRedirectUrl.searchParams.set('notification', 'error')
      errorRedirectUrl.searchParams.set('message', 'Leave application not found')
      console.log('❌ Leave not found, redirecting to:', errorRedirectUrl.toString())
      return NextResponse.redirect(errorRedirectUrl.toString())
    }

    const leave = leaveApp[0]
    const isApprove = action === 'approve'
    const statusValue = isApprove ? 1 : 2

    // Update database based on role
    if (role === 'manager') {
      // Check if already processed
      if (leave.approval_status_lm !== 0) {
        const errorRedirectUrl = new URL('/leaves', baseUrl)
        errorRedirectUrl.searchParams.set('notification', 'error')
        errorRedirectUrl.searchParams.set('message', 'This leave application has already been processed by the manager')
        console.log('❌ Already processed by manager, redirecting to:', errorRedirectUrl.toString())
        return NextResponse.redirect(errorRedirectUrl.toString())
      }

      // Update manager approval status
      await prisma.$executeRaw`
        UPDATE leave_application
        SET
          approval_status_lm = ${statusValue},
          approved = ${isApprove ? 0 : 0}
        WHERE id = ${leaveApplicationId}
      `

      // Send notification email to employee
      const employeeEmail = leave.employee_email || leave.emp_id + '@vis.com.pk'

      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: employeeEmail,
          subject: `Leave Application ${isApprove ? 'Approved' : 'Rejected'} by Manager`,
          html: generateApprovalNotificationEmail({
            employeeName: leave.employee_name,
            employeeId: leave.emp_id,
            leaveType: leave.leave_type_name,
            fromDate: leave.from_date,
            toDate: leave.to_date,
            numberOfDays: leave.no_of_days,
            status: isApprove ? 'approved' : 'rejected',
            approvedBy: leave.manager_name || 'Reporting Manager',
            role: 'Reporting Manager',
          }),
        })
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError)
      }

      // If approved by manager, notify HR
      if (isApprove) {
        const hrEmail = process.env.HR_EMAIL || 'hr@vis.com.pk'
        // Note: This would require generating a new HR token and sending email to HR
        // We'll handle this in the next step
      }

      // Redirect to portal with notification
      const successRedirectUrl = new URL('/leaves', baseUrl)
      successRedirectUrl.searchParams.set('notification', 'success')
      successRedirectUrl.searchParams.set('action', isApprove ? 'approved' : 'rejected')
      successRedirectUrl.searchParams.set('role', 'manager')
      successRedirectUrl.searchParams.set('employee', leave.employee_name)
      console.log('✅ Manager approval successful, redirecting to:', successRedirectUrl.toString())
      return NextResponse.redirect(successRedirectUrl.toString())

    } else if (role === 'hr') {
      // Check if manager approved first
      if (leave.approval_status_lm !== 1) {
        const errorRedirectUrl = new URL('/leaves', baseUrl)
        errorRedirectUrl.searchParams.set('notification', 'error')
        errorRedirectUrl.searchParams.set('message', 'Manager approval is required before HR can approve')
        console.log('❌ Manager approval required, redirecting to:', errorRedirectUrl.toString())
        return NextResponse.redirect(errorRedirectUrl.toString())
      }

      // Check if already processed
      if (leave.approval_status !== 0) {
        const errorRedirectUrl = new URL('/leaves', baseUrl)
        errorRedirectUrl.searchParams.set('notification', 'error')
        errorRedirectUrl.searchParams.set('message', 'This leave application has already been processed by HR')
        console.log('❌ Already processed by HR, redirecting to:', errorRedirectUrl.toString())
        return NextResponse.redirect(errorRedirectUrl.toString())
      }

      // Update HR approval status
      await prisma.$executeRaw`
        UPDATE leave_application
        SET
          approval_status = ${statusValue},
          approved = ${isApprove ? 1 : 0}
        WHERE id = ${leaveApplicationId}
      `

      // Send notification email to employee
      const employeeEmail = leave.employee_email || leave.emp_id + '@vis.com.pk'

      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: employeeEmail,
          subject: `Leave Application ${isApprove ? 'Approved' : 'Rejected'} by HR`,
          html: generateApprovalNotificationEmail({
            employeeName: leave.employee_name,
            employeeId: leave.emp_id,
            leaveType: leave.leave_type_name,
            fromDate: leave.from_date,
            toDate: leave.to_date,
            numberOfDays: leave.no_of_days,
            status: isApprove ? 'approved' : 'rejected',
            approvedBy: 'HR Department',
            role: 'HR Department',
          }),
        })
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError)
      }

      // Redirect to portal with notification
      const successRedirectUrl = new URL('/leaves', baseUrl)
      successRedirectUrl.searchParams.set('notification', 'success')
      successRedirectUrl.searchParams.set('action', isApprove ? 'approved' : 'rejected')
      successRedirectUrl.searchParams.set('role', 'hr')
      successRedirectUrl.searchParams.set('employee', leave.employee_name)
      console.log('✅ HR approval successful, redirecting to:', successRedirectUrl.toString())
      return NextResponse.redirect(successRedirectUrl.toString())
    }

    const errorRedirectUrl = new URL('/leaves', baseUrl)
    errorRedirectUrl.searchParams.set('notification', 'error')
    errorRedirectUrl.searchParams.set('message', 'Invalid role')
    console.log('❌ Invalid role, redirecting to:', errorRedirectUrl.toString())
    return NextResponse.redirect(errorRedirectUrl.toString())

  } catch (error) {
    console.error('❌ Error processing email approval:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const errorRedirectUrl = new URL('/leaves', baseUrl)
    errorRedirectUrl.searchParams.set('notification', 'error')
    errorRedirectUrl.searchParams.set('message', 'An error occurred while processing your request')
    console.log('❌ Exception caught, redirecting to:', errorRedirectUrl.toString())
    return NextResponse.redirect(errorRedirectUrl.toString())
  }
}

function generateSuccessPage(action: string, role: string, employeeName: string, leaveType: string) {
  const actionText = action === 'approved' ? 'Approved' : 'Rejected'
  const roleText = role === 'manager' ? 'Manager' : 'HR'
  const color = action === 'approved' ? '#10b981' : '#ef4444'
  const portalUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Leave ${actionText}</title>
  <meta http-equiv="refresh" content="3;url=${portalUrl}/leaves">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    .icon {
      width: 80px;
      height: 80px;
      background: ${color};
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 auto 24px;
      font-size: 48px;
      color: white;
    }
    h1 {
      color: #111827;
      font-size: 28px;
      margin: 0 0 12px;
      font-weight: 600;
    }
    p {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 32px;
    }
    .details {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      text-align: left;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #6b7280;
      font-size: 14px;
    }
    .detail-value {
      color: #111827;
      font-size: 14px;
      font-weight: 600;
    }
    .redirect-notice {
      background: #f3f4f6;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
      color: #6b7280;
      font-size: 14px;
    }
    .redirect-notice strong {
      color: #111827;
    }
    .portal-button {
      display: inline-block;
      margin-top: 16px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: transform 0.2s;
    }
    .portal-button:hover {
      transform: translateY(-2px);
    }
    @keyframes countdown {
      from { width: 100%; }
      to { width: 0%; }
    }
    .countdown-bar {
      height: 4px;
      background: ${color};
      margin-top: 16px;
      border-radius: 2px;
      animation: countdown 3s linear;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${action === 'approved' ? '✓' : '✗'}</div>
    <h1>Leave ${actionText} Successfully</h1>
    <p>You have successfully ${action === 'approved' ? 'approved' : 'rejected'} the leave application as ${roleText}.</p>

    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Employee:</span>
        <span class="detail-value">${employeeName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Leave Type:</span>
        <span class="detail-value">${leaveType}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status:</span>
        <span class="detail-value" style="color: ${color};">${actionText}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${actionText} By:</span>
        <span class="detail-value">${roleText}</span>
      </div>
    </div>

    <p style="font-size: 14px; margin: 0;">The employee has been notified via email.</p>

    <div class="redirect-notice">
      <strong>Redirecting to HR Portal...</strong><br>
      You will be redirected in 3 seconds
      <div class="countdown-bar"></div>
    </div>

    <a href="${portalUrl}/leaves" class="portal-button">Go to Portal Now</a>
  </div>
</body>
</html>
  `
}

function generateErrorPage(message: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    .icon {
      width: 80px;
      height: 80px;
      background: #ef4444;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 auto 24px;
      font-size: 48px;
      color: white;
    }
    h1 {
      color: #111827;
      font-size: 28px;
      margin: 0 0 12px;
      font-weight: 600;
    }
    p {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">!</div>
    <h1>Error</h1>
    <p>${message}</p>
  </div>
</body>
</html>
  `
}
