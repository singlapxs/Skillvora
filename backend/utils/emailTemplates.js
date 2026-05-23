/**
 * Email Templates for Skillvora Platform
 * Gorgeous, responsive, and mobile-friendly HTML emails.
 */

const logoUrl = 'https://img.icons8.com/color/96/domain.png'; // Premium looking generic logo

const brandColors = {
  primary: '#7c3aed', // violet-600
  secondary: '#1e1b4b', // deep violet-950
  text: '#1e293b', // slate-800
  muted: '#64748b', // slate-500
  success: '#10b981', // emerald-500
  danger: '#ef4444', // red-500
  bg: '#f8fafc' // slate-50
};

/**
 * Header wrapper
 */
const headerHtml = (title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: ${brandColors.bg};
      color: ${brandColors.text};
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: ${brandColors.bg};
      padding: 24px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background-color: ${brandColors.secondary};
      padding: 32px 24px;
      text-align: center;
      border-bottom: 4px solid ${brandColors.primary};
    }
    .logo {
      height: 48px;
      margin-bottom: 12px;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    .content {
      padding: 32px 24px;
      line-height: 1.6;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: ${brandColors.muted};
      border-top: 1px solid #e2e8f0;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: ${brandColors.primary};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin-top: 16px;
      box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .table th, .table td {
      border: 1px solid #e2e8f0;
      padding: 12px;
      text-align: left;
    }
    .table th {
      background-color: #f8fafc;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img class="logo" src="${logoUrl}" alt="Skillvora Logo">
        <h1>Skillvora Academy</h1>
      </div>
      <div class="content">
`;

/**
 * Footer wrapper
 */
const footerHtml = `
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Skillvora Academy. All rights reserved.</p>
        <p>This is an automated educational platform notification. Please do not reply directly.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

/**
 * Template 1: Registration Received (Admin Notification)
 */
const adminNotificationTemplate = (studentName, studentEmail, approvalLink) => {
  return `
    ${headerHtml('New Student Registration Pending')}
    <h2 style="color: ${brandColors.secondary}; margin-top: 0;">New Account Awaiting Approval</h2>
    <p>A new student has registered on the Skillvora platform and is currently waiting for your enrollment review.</p>
    
    <table class="table">
      <tr>
        <th>Student Name</th>
        <td>${studentName}</td>
      </tr>
      <tr>
        <th>Email Address</th>
        <td>${studentEmail}</td>
      </tr>
      <tr>
        <th>Registration Date</th>
        <td>${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</td>
      </tr>
      <tr>
        <th>Status</th>
        <td style="color: ${brandColors.primary}; font-weight: bold;">Pending Review</td>
      </tr>
    </table>
    
    <p>Please review and approve or reject this student's access request using the administrator dashboard button below:</p>
    <div style="text-align: center; margin: 32px 0 16px;">
      <a href="${approvalLink}" class="btn" target="_blank">Open Admin Dashboard</a>
    </div>
    ${footerHtml}
  `;
};

/**
 * Template 2: Enrollment Approved (Confirmation to Student)
 */
const studentApprovedTemplate = (studentName, loginLink) => {
  return `
    ${headerHtml('Enrollment Approved!')}
    <h2 style="color: ${brandColors.success}; margin-top: 0;">Welcome to Skillvora, ${studentName}!</h2>
    <p>We are thrilled to inform you that your registration and enrollment request has been <strong>approved</strong> by the administrator.</p>
    
    <p>Your account is now fully active. You have complete access to all courses, modular lectures, video guides, downloadable PDF documents, assignments, and notes files.</p>
    
    <table class="table" style="margin: 24px 0;">
      <tr>
        <th style="width: 40%;">Enrollment Status</th>
        <td style="color: ${brandColors.success}; font-weight: bold;">Active / Approved</td>
      </tr>
      <tr>
        <th>Access Duration</th>
        <td>Unlimited Lifetime Access</td>
      </tr>
    </table>
    
    <p>Click the button below to log in and start learning immediately:</p>
    <div style="text-align: center; margin: 32px 0 16px;">
      <a href="${loginLink}" class="btn" style="background-color: ${brandColors.success}; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);" target="_blank">Access Your Dashboard</a>
    </div>
    ${footerHtml}
  `;
};

/**
 * Template 3: Enrollment Rejected (Rejection notification to Student)
 */
const studentRejectedTemplate = (studentName) => {
  return `
    ${headerHtml('Enrollment Request Update')}
    <h2 style="color: ${brandColors.danger}; margin-top: 0;">Account Status Update</h2>
    <p>Hello ${studentName},</p>
    <p>Thank you for your interest in the Skillvora learning platform.</p>
    <p>After reviewing your registration request, the administrator has decided to <strong>decline</strong> your account enrollment at this time.</p>
    
    <p>If you believe this was an error or wish to appeal the decision, please contact the platform administrator directly at your convenience.</p>
    
    <div style="border-left: 4px solid ${brandColors.danger}; padding: 12px 16px; background-color: #fef2f2; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #991b1b; font-size: 14px;">
        <strong>Notice:</strong> Your credentials will not grant access to the learning panel or watch folders unless your registration status is updated.
      </p>
    </div>
    ${footerHtml}
  `;
};

module.exports = {
  adminNotificationTemplate,
  studentApprovedTemplate,
  studentRejectedTemplate
};
