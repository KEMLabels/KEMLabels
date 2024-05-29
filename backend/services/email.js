const nodemailer = require("nodemailer");
require("express-async-errors");
const path = require("path");
const logger = require("../utils/logger");

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Helper function to send email
function sendMail(recipientEmail, subject, content, attachments = []) {
  const mailOptions = {
    from: `KEMLabels <${process.env.MAIL_USER}>`,
    to: recipientEmail,
    subject: subject,
    attachments: [
      {
        filename: "logo.png",
        path: path.join(__dirname, "../public/logo.png"),
        cid: "logo",
      },
      ...attachments,
    ],
    html: `
      <div style="max-width: 1000px;border:solid 1px #CBCBCB; margin: 0 auto;padding: 50px 60px;box-sizing:border-box;">
        <div style="max-width:200px; margin-bottom:2rem;">
          <img src="cid:logo" style="width: 100%;object-fit:contain; object-position:center center;"/>
        </div>
        ${content}
        <p>Thank you,<br/>KEMLabels Team</p>
      </div>
    `,
  };

  return new Promise((res, rej) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        const error = typeof err === Object ? JSON.stringify(err) : err;
        logger(`Error sending email: ${error}`, "error");
        rej(err.message || err);
      } else res("Email sent successfully");
    });
  });
}

// Email for sign up confirmation
async function sendSignUpEmail(email, url) {
  const content = `<p>Thank you for signing up with us!</p>
  <p>Please use the following <a href="${url}" target="_blank" style="color:#0066ff!important;text-decoration:none">link here</a> to confirm your email address.</p>
  <p>If you did not sign up for KEMLabels, you can safely ignore this email.</p>
  <p>Have any questions? Please contact us at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
  await sendMail(email, "Confirm your email address", content);
  logger(`Sign up email confirmation sent successfully to ${email}.`, "info");
}

// Email for forgot password
async function sendForgotPasswordEmail(email, otp) {
  const content = `<p>We received a request to reset the password associated with your account.</p>
  <p>To confirm your email address, please enter the 4 digit code below.</p>
  <div style="margin: 2rem; text-align: center;"><h1 style="letter-spacing: 5px">${otp}</h1></div>
  <p>If you did not initiate this request, you can safely ignore this email or let us know.</p>
  <p>Have any questions? Please contact us at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
  await sendMail(
    email,
    "KEMLabels - Your Verification Code to Reset Password",
    content
  );
  logger(
    `Forgot password email with OTP code sent successfully to ${email}.`,
    "info"
  );
}

// Email for password update
async function sendPasswordUpdateEmail(email) {
  const content = `<h1 style="margin-bottom: 2rem;">Did you change your password?</h1>
  <p>We noticed the password for your KEMLabels' account was recently changed. If this was you, rest assured that your new password is now in effect. No further action is required and you can safely ignore this email.</p>
  <p>However, if you did not request this change, please contact our support team immediately at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
  await sendMail(
    email,
    "KEMLabels Security Alert - Your Password Has Been Updated",
    content
  );
  logger(
    `Password update confirmation email sent successfully to ${email}.`,
    "info"
  );
}

// Email for username update
async function sendUsernameUpdateEmail(email) {
  const content = `<h1 style="margin-bottom: 2rem;">Did you change your username?</h1>
  <p>We noticed the username for your KEMLabels' account was recently changed. If this was you, rest assured that your new username is now in effect. No further action is required and you can safely ignore this email.</p>
  <p>However, if you did not request this change, please contact our support team immediately at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
  await sendMail(
    email,
    "KEMLabels Security Alert - Your Username Has Been Updated",
    content
  );
  logger(
    `Username update confirmation email sent successfully to ${email}.`,
    "info"
  );
}

async function sendEmailUpdateEmail(email) {
  const content = `<h1 style="margin-bottom: 2rem;">Did you change your email?</h1>
  <p>We noticed the email for your KEMLabels' account was recently changed. If this was you, rest assured that your new email is now in effect. No further action is required and you can safely ignore this email.</p>
  <p>However, if you did not request this change, please contact our support team immediately at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
  await sendMail(
    email,
    "KEMLabels Security Alert - Your Email Has Been Updated",
    content
  );
  logger(
    `Email update confirmation email sent successfully to ${email}.`,
    "info"
  );
}

async function sendEmailUpdateRequestEmail(email) {
  const content = `<h1 style="margin-bottom: 2rem;">Did you change your email?</h1>
  <p>We received a request to change the email associated with your account. If this was you, you can safely ignore this email.</p>
  <p>However, if you did not request this change, please contact our support team immediately at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
  await sendMail(
    email,
    "KEMLabels Security Alert - Email Change Detected on Your Account",
    content
  );
}

async function sendEmailUpdateOtpEmail(email, otp) {
  const content = `<p>We received a request to change the email associated with your account.</p>
  <p>To confirm your new email address, please enter the 4 digit code below.</p>
  <div style="margin: 2rem; text-align: center;"><h1 style="letter-spacing: 5px">${otp}</h1></div>
  <p>If you did not initiate this request, you can safely ignore this email or let us know.</p>
  <p>Have any questions? Please contact us at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
  await sendMail(
    email,
    "KEMLabels - Your Verification Code to Change Email",
    content
  );
}

async function sendPasswordUpdateOtpEmail(email, otp) {
  const content = `<p>We received a request to change the password associated with your account.</p>
  <p>To confirm your new password, please enter the 4 digit code below.</p>
  <div style="margin: 2rem; text-align: center;"><h1 style="letter-spacing: 5px">${otp}</h1></div>
  <p>If you did not initiate this request, you can safely ignore this email or let us know.</p>
  <p>Have any questions? Please contact us at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
  await sendMail(
    email,
    "KEMLabels - Your Verification Code to Change Password",
    content
  );
}

async function sendLabelOrderCustomerEmail(
  email,
  fileContent,
  filename,
  tracking = null
) {
  const content = tracking
    ? `<h1 style="margin-bottom: 2rem;">Thank you for choosing KEMLabels for your shipping label!</h1>
  <p>Your shipping label for tracking number <strong>${tracking}</strong> has been received and is attached to this email as a PDF file.</p>
  <p>For any questions or concerns, please contact our support team at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`
    : `<h1 style="margin-bottom: 2rem;">Thank you for choosing KEMLabels for your shipping label!</h1>
  <p>Your bulk shipping labels have been received and are attached to this email as a ZIP file.</p>
  <p>For any questions or concerns, please contact our support team at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;

  const ext = filename.split(".").pop();
  let newFilename = filename;
  if (ext === "pdf") newFilename = "shipping_label.pdf";
  if (ext === "zip") newFilename = "shipping_labels.zip";

  const attachments = [
    {
      filename: newFilename,
      path: path.join(__dirname, "../shippingLabels/", email, filename),
      content: fileContent,
    },
  ];
  await sendMail(
    email,
    "KEMLabels - Your Shipping Label Order is Received",
    content,
    attachments
  );
}

async function sendLabelOrderAdminEmail(
  email,
  fileContent,
  filename,
  tracking = null
) {
  const content = tracking
    ? `<h1 style="margin-bottom: 2rem;">New Shipping Label Order Received</h1>
  <p>A new shipping label for tracking number <strong>${tracking}</strong> has been ordered by a customer.</p>
  <p>The shipping label is attached to this email as a PDF file.</p>
  <p>For any questions or concerns, please contact our support team at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`
    : `<h1 style="margin-bottom: 2rem;">New Bulk Shipping Label Order Received</h1>
  <p>A new bulk shipping label order has been received by a customer.</p>
  <p>The shipping labels are attached to this email as a ZIP file.</p>
  <p>For any questions or concerns, please contact our support team at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;

  const ext = filename.split(".").pop();
  let newFilename = filename;
  if (ext === "pdf") newFilename = "shipping_label.pdf";
  if (ext === "zip") newFilename = "shipping_labels.zip";

  const attachments = [
    {
      filename: newFilename,
      path: path.join(__dirname, "../shippingLabels/", email, filename),
      content: fileContent,
    },
  ];
  await sendMail(
    process.env.MAIL_USER,
    "KEMLabels - New Shipping Label Order Received",
    content,
    attachments
  );
}

module.exports = {
  sendSignUpEmail,
  sendForgotPasswordEmail,
  sendPasswordUpdateEmail,
  sendUsernameUpdateEmail,
  sendEmailUpdateEmail,
  sendEmailUpdateRequestEmail,
  sendEmailUpdateOtpEmail,
  sendPasswordUpdateOtpEmail,
  sendLabelOrderCustomerEmail,
  sendLabelOrderAdminEmail,
};
