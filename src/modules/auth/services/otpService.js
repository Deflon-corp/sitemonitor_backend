/**
 * OTP Service
 */

/**
 * Generate a 6-digit numeric OTP
 * @returns {string}
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Save OTP and expiry time to user/admin document
 * @param {Object} userDoc - Mongoose document
 * @param {string} otp - 6-digit OTP
 * @param {number} expiryMinutes - Expiry time in minutes
 * @returns {Promise<void>}
 */
async function saveOTP(userDoc, otp, expiryMinutes = 5) {
  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + expiryMinutes);

  if (userDoc.user_id !== undefined) {
    // It's a User
    userDoc.user_otp = otp;
    userDoc.user_otp_expiry = expiryDate;
  } else if (userDoc.admin_id !== undefined) {
    // It's an Admin
    userDoc.admin_otp = otp;
    userDoc.admin_otp_expiry = expiryDate;
  }

  await userDoc.save();
}

/**
 * Verify OTP and check expiry
 * @param {Object} userDoc - Mongoose document
 * @param {string} otp - 6-digit OTP
 * @returns {Object} { success: boolean, message: string }
 */
function verifyOTP(userDoc, otp) {
  const storedOtp = userDoc.user_id !== undefined ? userDoc.user_otp : userDoc.admin_otp;
  const expiryDate = userDoc.user_id !== undefined ? userDoc.user_otp_expiry : userDoc.admin_otp_expiry;

  if (!storedOtp || storedOtp !== otp) {
    return { success: false, message: "Invalid OTP." };
  }

  if (new Date() > new Date(expiryDate)) {
    return { success: false, message: "OTP has expired." };
  }

  return { success: true, message: "OTP verified successfully." };
}

/**
 * Clear OTP after use
 * @param {Object} userDoc - Mongoose document
 */
async function clearOTP(userDoc) {
  if (userDoc.user_id !== undefined) {
    userDoc.user_otp = null;
    userDoc.user_otp_expiry = null;
  } else if (userDoc.admin_id !== undefined) {
    userDoc.admin_otp = null;
    userDoc.admin_otp_expiry = null;
  }
  await userDoc.save();
}

module.exports = {
  generateOTP,
  saveOTP,
  verifyOTP,
  clearOTP,
};
