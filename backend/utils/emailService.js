const nodemailer = require("nodemailer");

const {
  adminNotificationTemplate,
  studentApprovedTemplate,
  studentRejectedTemplate,
  courseRequestAdminTemplate,
  courseRequestApprovedTemplate,
  courseRequestRejectedTemplate,
} = require("./emailTemplates");

/* =========================================================
   CREATE GMAIL TRANSPORTER
========================================================= */

const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.warn(
      "[Email System] Missing EMAIL_USER or EMAIL_PASS in environment variables"
    );
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,

    auth: {
      user: emailUser,
      pass: emailPass,
    },

    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,

    tls: {
      rejectUnauthorized: false,
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error("[SMTP ERROR]", error);
    } else {
      console.log("[SMTP READY] Gmail SMTP Connected Successfully");
    }
  });

  return transporter;
};

/* =========================================================
   SENDER EMAIL
========================================================= */

const getSenderEmail = () => {
  return process.env.EMAIL_USER || "no-reply@skillvora.com";
};

/* =========================================================
   COMMON SEND MAIL FUNCTION
========================================================= */

/* =========================================================
   SEND VIA GOOGLE APPS SCRIPT
========================================================= */

const sendViaAppsScript = async ({ to, subject, html }) => {
  const url = process.env.EMAIL_SCRIPT_URL;
  const apiKey = process.env.EMAIL_SCRIPT_KEY;
  if (!url) return false;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        apiKey,
      }),
    });

    const data = await response.json();
    if (data && data.success) {
      console.log(`[Email System] Email sent via Google Apps Script to ${to}`);
      return true;
    } else {
      console.error(`[Email System] Google Apps Script sending failed:`, data ? data.error : "Unknown error");
      return false;
    }
  } catch (error) {
    console.error(`[Email System] Google Apps Script network error:`, error.message);
    return false;
  }
};

/* =========================================================
   QUEUE EMAIL IN DATABASE
========================================================= */

const queueEmail = async ({ to, subject, html }) => {
  try {
    const EmailQueue = require('../models/EmailQueue');
    await EmailQueue.create({ to, subject, html });
    console.log(`[Email System] Email successfully queued for ${to}`);
    return true;
  } catch (error) {
    console.error(`[Email System] Failed to queue email for ${to}:`, error);
    return false;
  }
};

const sendEmail = async ({
  to,
  subject,
  html,
  replyTo = undefined,
}) => {
  // 1. Check if Google Apps Script is configured (port 443 HTTPS - bypasses Render port block)
  if (process.env.EMAIL_SCRIPT_URL) {
    const success = await sendViaAppsScript({ to, subject, html });
    if (success) return true;
  }

  // 2. Check if we should queue the email in database (for cron processing)
  if (process.env.USE_EMAIL_QUEUE === 'true') {
    return await queueEmail({ to, subject, html });
  }

  // 3. Fallback to direct SMTP (works on localhost/development)
  const transporter = createTransporter();

  if (!transporter) {
    console.log("[Email System] Transporter not available");
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: {
        name: "Skillvora Academy",
        address: getSenderEmail(),
      },

      to,

      subject,

      html,

      replyTo,

      headers: {
        "X-Priority": "1",
      },
    });

    console.log(`[Email Sent] ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[Email Send Error]", error);
    return false;
  }
};

/* =========================================================
   ADMIN NOTIFICATION
========================================================= */

const sendAdminNotification = async (
  studentName,
  studentEmail
) => {
  const adminEmail =
    process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  const clientUrl =
    process.env.CLIENT_URL || "http://localhost:5173";

  const approvalLink = `${clientUrl}/admin/dashboard`;

  const htmlContent = adminNotificationTemplate(
    studentName,
    studentEmail,
    approvalLink
  );

  return await sendEmail({
    to: adminEmail,

    subject: `[Skillvora] New Student Registration: ${studentName}`,

    html: htmlContent,

    replyTo: studentEmail,
  });
};

/* =========================================================
   STUDENT APPROVAL EMAIL
========================================================= */

const sendApprovalConfirmation = async (
  studentName,
  studentEmail
) => {
  const clientUrl =
    process.env.CLIENT_URL || "http://localhost:5173";

  const loginLink = `${clientUrl}/login`;

  const htmlContent = studentApprovedTemplate(
    studentName,
    loginLink
  );

  return await sendEmail({
    to: studentEmail,

    subject:
      "[Skillvora] Your Enrollment Request Has Been Approved!",

    html: htmlContent,
  });
};

/* =========================================================
   STUDENT REJECTION EMAIL
========================================================= */

const sendRejectionNotification = async (
  studentName,
  studentEmail
) => {
  const htmlContent =
    studentRejectedTemplate(studentName);

  return await sendEmail({
    to: studentEmail,

    subject:
      "[Skillvora] Enrollment Request Update",

    html: htmlContent,
  });
};

/* =========================================================
   COURSE REQUEST EMAIL TO ADMIN
========================================================= */

const sendCourseRequestNotification = async (
  studentName,
  studentEmail,
  courseTitle
) => {
  const adminEmail =
    process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  const clientUrl =
    process.env.CLIENT_URL || "http://localhost:5173";

  const approvalLink = `${clientUrl}/admin/dashboard`;

  const htmlContent = courseRequestAdminTemplate(
    studentName,
    studentEmail,
    courseTitle,
    approvalLink
  );

  console.log(
    `[Course Request] ${studentName} requested "${courseTitle}"`
  );

  return await sendEmail({
    to: adminEmail,

    subject: `[Skillvora] New Course Request: ${courseTitle}`,

    html: htmlContent,

    replyTo: studentEmail,
  });
};

/* =========================================================
   COURSE APPROVAL EMAIL
========================================================= */

const sendCourseApprovalNotification = async (
  studentName,
  studentEmail,
  courseTitle,
  courseId
) => {
  const clientUrl =
    process.env.CLIENT_URL || "http://localhost:5173";

  const watchLink = `${clientUrl}/watch/${courseId}`;

  const htmlContent = courseRequestApprovedTemplate(
    studentName,
    courseTitle,
    watchLink
  );

  return await sendEmail({
    to: studentEmail,

    subject: `[Skillvora] Course Approved: ${courseTitle}`,

    html: htmlContent,
  });
};

/* =========================================================
   COURSE REJECTION EMAIL
========================================================= */

const sendCourseRejectionNotification = async (
  studentName,
  studentEmail,
  courseTitle
) => {
  const htmlContent = courseRequestRejectedTemplate(
    studentName,
    courseTitle
  );

  return await sendEmail({
    to: studentEmail,

    subject: `[Skillvora] Course Request Rejected: ${courseTitle}`,

    html: htmlContent,
  });
};

/* =========================================================
   PROCESS EMAIL QUEUE (FOR CRON WORKER)
========================================================= */

const processEmailQueue = async () => {
  const EmailQueue = require("../models/EmailQueue");
  
  // Find pending or failed emails with less than 3 attempts
  const pendingEmails = await EmailQueue.find({
    status: { $in: ["pending", "failed"] },
    attempts: { $lt: 3 },
  });

  if (pendingEmails.length === 0) {
    console.log("[Email System] No pending emails in the queue");
    return;
  }

  console.log(`[Email System] Processing ${pendingEmails.length} queued emails...`);

  // Direct SMTP transporter for the worker
  const transporter = createTransporter();
  if (!transporter) {
    console.error("[Email System] SMTP Transporter not available for worker");
    return;
  }

  for (const email of pendingEmails) {
    email.status = "processing";
    await email.save();

    try {
      const info = await transporter.sendMail({
        from: {
          name: "Skillvora Academy",
          address: getSenderEmail(),
        },
        to: email.to,
        subject: email.subject,
        html: email.html,
        headers: {
          "X-Priority": "1",
        },
      });

      email.status = "sent";
      email.sentAt = new Date();
      email.attempts += 1;
      await email.save();
      console.log(`[Email System] Sent queued email to ${email.to}: ${info.messageId}`);
    } catch (error) {
      email.status = "failed";
      email.attempts += 1;
      email.error = error.message;
      await email.save();
      console.error(`[Email System] Failed to send queued email to ${email.to}:`, error);
    }
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  sendAdminNotification,
  sendApprovalConfirmation,
  sendRejectionNotification,
  sendCourseRequestNotification,
  sendCourseApprovalNotification,
  sendCourseRejectionNotification,
  processEmailQueue,
};