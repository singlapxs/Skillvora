const nodemailer = require('nodemailer');
const {
  adminNotificationTemplate,
  studentApprovedTemplate,
  studentRejectedTemplate,
  courseRequestAdminTemplate,
  courseRequestApprovedTemplate,
  courseRequestRejectedTemplate
} = require('./emailTemplates');

/**
 * Creates a Nodemailer transporter.
 * Utilizes Gmail SMTP by default, with custom fallback support.
 */
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  // Fallback to Gmail if SMTP_HOST is not configured
  if (!smtpHost) {
    if (!smtpUser || !smtpPass || smtpUser === 'admin@example.com') {
      console.warn('[Email System] Warning: SMTP credentials not configured. Emails will be logged to console only.');
      return null;
    }
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  }

  // Use custom SMTP server (highly recommended for cloud environments like Render)
  console.log(`[Email System] Initializing custom SMTP transport: ${smtpHost}:${smtpPort}`);
  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: smtpPort == 465, // true for 465, false for 587/2525
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    tls: {
      rejectUnauthorized: false // Prevents SSL connection handshakes from failing on Render
    }
  });
};

/**
 * Resolves the sender email address dynamically.
 * Fallback order: EMAIL_USER -> SMTP_USER -> no-reply@skillvora.com
 */
const getSenderEmail = () => {
  return process.env.EMAIL_USER || process.env.SMTP_USER || 'no-reply@skillvora.com';
};

/**
 * Sends a pending registration notification to the Administrator.
 */
const sendAdminNotification = async (studentName, studentEmail) => {
  const transporter = createTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@example.com';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const approvalLink = `${clientUrl}/admin/dashboard`;

  const htmlContent = adminNotificationTemplate(studentName, studentEmail, approvalLink);

  if (!transporter) {
    console.log('\n=================== [SIMULATED EMAIL TO ADMIN] ===================');
    console.log(`To: ${adminEmail}`);
    console.log('Subject: [Skillvora] New Registration Pending Admin Approval');
    console.log(`Body:\nStudent Name: ${studentName}\nStudent Email: ${studentEmail}\nDashboard Link: ${approvalLink}`);
    console.log('==================================================================\n');
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Skillvora Academy" <${getSenderEmail()}>`,
      to: adminEmail,
      subject: `[Skillvora] New Student Registration Pending: ${studentName}`,
      html: htmlContent
    });
    console.log(`[Email System] Admin notification email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email System Error] Failed to send admin notification email: ${error.message}`);
    return false;
  }
};

/**
 * Sends an enrollment approval confirmation to the Student.
 */
const sendApprovalConfirmation = async (studentName, studentEmail) => {
  const transporter = createTransporter();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const loginLink = `${clientUrl}/login`;

  const htmlContent = studentApprovedTemplate(studentName, loginLink);

  if (!transporter) {
    console.log('\n================== [SIMULATED EMAIL TO STUDENT] ==================');
    console.log(`To: ${studentEmail}`);
    console.log('Subject: [Skillvora] Enrollment Request Approved!');
    console.log(`Body:\nHello ${studentName},\nYour account has been approved!\nAccess Link: ${loginLink}`);
    console.log('==================================================================\n');
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Skillvora Academy" <${getSenderEmail()}>`,
      to: studentEmail,
      subject: `[Skillvora] Your Enrollment Request has been Approved!`,
      html: htmlContent
    });
    console.log(`[Email System] Student approval email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email System Error] Failed to send student approval email: ${error.message}`);
    return false;
  }
};

/**
 * Sends an enrollment rejection email to the Student.
 */
const sendRejectionNotification = async (studentName, studentEmail) => {
  const transporter = createTransporter();
  const htmlContent = studentRejectedTemplate(studentName);

  if (!transporter) {
    console.log('\n================== [SIMULATED EMAIL TO STUDENT] ==================');
    console.log(`To: ${studentEmail}`);
    console.log('Subject: [Skillvora] Enrollment Request Update');
    console.log(`Body:\nHello ${studentName},\nWe regret to inform you that your enrollment has been rejected.`);
    console.log('==================================================================\n');
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Skillvora Academy" <${getSenderEmail()}>`,
      to: studentEmail,
      subject: `[Skillvora] Enrollment Request Update`,
      html: htmlContent
    });
    console.log(`[Email System] Student rejection email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email System Error] Failed to send student rejection email: ${error.message}`);
    return false;
  }
};

const sendCourseRequestNotification = async (studentName, studentEmail, courseTitle) => {
  const transporter = createTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@example.com';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const approvalLink = `${clientUrl}/admin/dashboard`;

  const htmlContent = courseRequestAdminTemplate(studentName, studentEmail, courseTitle, approvalLink);

  console.log(`[Email Service] Attempting to send course request notification. Student: "${studentName}" (${studentEmail}), Course: "${courseTitle}". Sender Account: "${getSenderEmail()}", Admin Inbox: "${adminEmail}"`);

  if (!transporter) {
    console.log('\n=================== [SIMULATED EMAIL TO ADMIN] ===================');
    console.log(`To: ${adminEmail}`);
    console.log(`Subject: [Skillvora] New Course Request from ${studentName}`);
    console.log(`Body:\nStudent Name: ${studentName}\nStudent Email: ${studentEmail}\nRequested Course: ${courseTitle}\nDashboard Link: ${approvalLink}`);
    console.log('==================================================================\n');
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Skillvora Academy" <${getSenderEmail()}>`,
      to: adminEmail,
      replyTo: studentEmail, // Allows admin to reply directly to the student and passes SPF reputation
      subject: `[Skillvora] New Course Request from ${studentName}: ${courseTitle}`,
      html: htmlContent
    });
    console.log(`[Email System] Course request notification email successfully sent: ${info.messageId} to ${adminEmail}`);
    return true;
  } catch (error) {
    console.error(`[Email System Error] Failed to send course request email to ${adminEmail}: ${error.message}`);
    return false;
  }
};

const sendCourseApprovalNotification = async (studentName, studentEmail, courseTitle, courseId) => {
  const transporter = createTransporter();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const watchLink = `${clientUrl}/watch/${courseId}`;

  const htmlContent = courseRequestApprovedTemplate(studentName, courseTitle, watchLink);

  if (!transporter) {
    console.log('\n================== [SIMULATED EMAIL TO STUDENT] ==================');
    console.log(`To: ${studentEmail}`);
    console.log(`Subject: [Skillvora] Course Enrollment Approved: ${courseTitle}!`);
    console.log(`Body:\nHello ${studentName},\nYour request for the course "${courseTitle}" has been approved!\nAccess Player Link: ${watchLink}`);
    console.log('==================================================================\n');
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Skillvora Academy" <${getSenderEmail()}>`,
      to: studentEmail,
      subject: `[Skillvora] Course Enrollment Approved: ${courseTitle}!`,
      html: htmlContent
    });
    console.log(`[Email System] Student course approval email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email System Error] Failed to send course approval email: ${error.message}`);
    return false;
  }
};

const sendCourseRejectionNotification = async (studentName, studentEmail, courseTitle) => {
  const transporter = createTransporter();
  const htmlContent = courseRequestRejectedTemplate(studentName, courseTitle);

  if (!transporter) {
    console.log('\n================== [SIMULATED EMAIL TO STUDENT] ==================');
    console.log(`To: ${studentEmail}`);
    console.log(`Subject: [Skillvora] Course Request Update: ${courseTitle}`);
    console.log(`Body:\nHello ${studentName},\nYour enrollment request for "${courseTitle}" has been declined.`);
    console.log('==================================================================\n');
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Skillvora Academy" <${getSenderEmail()}>`,
      to: studentEmail,
      subject: `[Skillvora] Course Request Update: ${courseTitle}`,
      html: htmlContent
    });
    console.log(`[Email System] Student course rejection email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email System Error] Failed to send course rejection email: ${error.message}`);
    return false;
  }
};

module.exports = {
  sendAdminNotification,
  sendApprovalConfirmation,
  sendRejectionNotification,
  sendCourseRequestNotification,
  sendCourseApprovalNotification,
  sendCourseRejectionNotification
};
