const nodemailer = require("nodemailer");
const { loadTemplate } = require("../utils/template");

/**
 * Email Transporter Configuration
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASS || "your-app-password",
  },
});

/**
 * Send OTP Email
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit OTP
 */
async function sendOTPEmail(to, otp) {
  try {
    const htmlContent = await loadTemplate("otp", { otp });

    const mailOptions = {
      from: `"Sitemonitor Support" <${process.env.EMAIL_USER || "your-email@gmail.com"}>`,
      to: to,
      subject: "Your OTP for Login",
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("OTP Email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
}

/**
 * Send Welcome Email
 * @param {string} to - Recipient email
 * @param {string} name - User's name
 */
async function sendWelcomeEmail(to, name) {
  try {
    const htmlContent = await loadTemplate("welcome", { name });

    const mailOptions = {
      from: `"Sitemonitor Support" <${process.env.EMAIL_USER || "your-email@gmail.com"}>`,
      to: to,
      subject: "Welcome to Sitemonitor!",
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome Email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
}

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
};

