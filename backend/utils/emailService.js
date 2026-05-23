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

const sendEmail = async ({
  to,
  subject,
  html,
  replyTo = undefined,
}) => {
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
   EXPORTS
========================================================= */

module.exports = {
  sendAdminNotification,
  sendApprovalConfirmation,
  sendRejectionNotification,
  sendCourseRequestNotification,
  sendCourseApprovalNotification,
  sendCourseRejectionNotification,
};