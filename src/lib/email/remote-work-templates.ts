// Remote Work Application Email Templates

interface RemoteWorkApplicationData {
  id: number
  employeeName: string
  employeeId: string
  fromDate: string
  toDate: string
  numberOfDays: number
  reason: string
  applicationDate: string
  approvalToken: string
}

export function generateRemoteWorkApplicationEmail(
  data: RemoteWorkApplicationData,
  recipientRole: 'manager' | 'hr',
  baseUrl: string
) {
  const approveUrl = `${baseUrl}/api/remote-work/email-approval?token=${data.approvalToken}&action=approve&role=${recipientRole}`
  const rejectUrl = `${baseUrl}/api/remote-work/email-approval?token=${data.approvalToken}&action=reject&role=${recipientRole}`

  const roleText = recipientRole === 'manager' ? 'Reporting Manager' : 'HR Department'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Remote Work Application - ${data.employeeName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Remote Work Application</h1>
              <p style="margin: 10px 0 0; color: #cffafe; font-size: 14px;">New remote work request requires your attention</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">

              <!-- Greeting -->
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Dear ${roleText},
              </p>

              <p style="margin: 0 0 30px; color: #6b7280; font-size: 15px; line-height: 1.6;">
                A new remote work application has been submitted and requires your approval.
              </p>

              <!-- Employee Details Card -->
              <div style="background-color: #f9fafb; border-left: 4px solid #06b6d4; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
                <h2 style="margin: 0 0 15px; color: #111827; font-size: 18px; font-weight: 600;">Employee Information</h2>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Employee Name:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.employeeName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Employee ID:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.employeeId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Application Date:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.applicationDate}</td>
                  </tr>
                </table>
              </div>

              <!-- Remote Work Details Card -->
              <div style="background-color: #ecfeff; border-left: 4px solid #06b6d4; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
                <h2 style="margin: 0 0 15px; color: #111827; font-size: 18px; font-weight: 600;">Remote Work Details</h2>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #155e75; font-size: 14px; width: 40%;">From Date:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.fromDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #155e75; font-size: 14px;">To Date:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.toDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #155e75; font-size: 14px;">Number of Days:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.numberOfDays} day${data.numberOfDays > 1 ? 's' : ''}</td>
                  </tr>
                </table>
              </div>

              <!-- Reason Card -->
              <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
                <h2 style="margin: 0 0 10px; color: #111827; font-size: 18px; font-weight: 600;">Reason</h2>
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">${data.reason || 'No reason provided'}</p>
              </div>

              <!-- Action Buttons -->
              <div style="text-align: center; margin: 40px 0 30px;">
                <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">Click below to approve or reject this remote work application:</p>

                <!-- Approve Button -->
                <a href="${approveUrl}" style="display: inline-block; margin: 0 10px; padding: 14px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.4);">
                  ✓ Approve Remote Work
                </a>

                <!-- Reject Button -->
                <a href="${rejectUrl}" style="display: inline-block; margin: 0 10px; padding: 14px 32px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.4);">
                  ✗ Reject Remote Work
                </a>
              </div>

              <!-- Footer Note -->
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6; text-align: center;">
                  You can also manage remote work applications by logging into the HR Portal.<br>
                  This is an automated email from the HR Portal system.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © ${new Date().getFullYear()} HR Portal. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export function generateRemoteWorkApprovalNotificationEmail(
  data: {
    employeeName: string
    employeeId: string
    fromDate: string
    toDate: string
    numberOfDays: number
    status: 'approved' | 'rejected'
    approvedBy: string
    role: string
  }
) {
  const isApproved = data.status === 'approved'
  const statusColor = isApproved ? '#10b981' : '#ef4444'
  const statusText = isApproved ? 'Approved' : 'Rejected'
  const statusIcon = isApproved ? '✓' : '✗'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Remote Work ${statusText}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: ${statusColor}; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">${statusIcon} Remote Work ${statusText}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Dear ${data.employeeName},
              </p>

              <p style="margin: 0 0 30px; color: #6b7280; font-size: 15px; line-height: 1.6;">
                Your remote work application has been <strong style="color: ${statusColor};">${statusText.toLowerCase()}</strong> by ${data.role}.
              </p>

              <!-- Remote Work Details -->
              <div style="background-color: #f9fafb; border-left: 4px solid ${statusColor}; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
                <h2 style="margin: 0 0 15px; color: #111827; font-size: 18px; font-weight: 600;">Remote Work Details</h2>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">From Date:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.fromDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">To Date:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.toDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Number of Days:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.numberOfDays} day${data.numberOfDays > 1 ? 's' : ''}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${statusText} By:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.approvedBy}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6; text-align: center;">
                  This is an automated email from the HR Portal system.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © ${new Date().getFullYear()} HR Portal. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
