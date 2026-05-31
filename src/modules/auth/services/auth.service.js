const passwordUtil = require("../../../utils/password");
const jwtUtil = require("../../../utils/jwt");
const otpService = require("./otpService");
const { sendOTPEmail } = require("../../../config/email.config");

/**
 * Authenticate User/Admin Service
 */
async function authenticateUser(payload) {
  const { login_id, password, tenantConnection } = payload;

  try {
    const { userSchema } = require("../../user/models/user.model");
    const UserModel = tenantConnection.models.User || tenantConnection.model("User", userSchema);
    // 1. Check in User Model
    const user = await UserModel.findOne({
      $or: [
        { user_email: login_id.toLowerCase() },
        { user_mobile_no: login_id },
        { user_login_id: login_id.toLowerCase() },
      ],
      user_is_deleted: false,
    });
    if (user) {
      if (user.user_status !== "active") {
        return { statusCode: 403, success: false, message: `Inactive Id | Connect with support system` };
      }

      const isPasswordValid = await passwordUtil.comparePassword(password, user.user_password);
      if (!isPasswordValid) {
        return { statusCode: 401, success: false, message: "Please enter a valid password." };
      }

      const tokenPayload = {
        user_id: user.user_id,
        email: user.user_email,
        role: user.user_role,
      };

      const accessToken = jwtUtil.signAccessToken(tokenPayload);
      const refreshToken = jwtUtil.signRefreshToken(tokenPayload);

      user.user_last_login = new Date();
      await user.save();

      return {
        statusCode: 200,
        success: true,
        message: "Logged in successfully",
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          user: {
            user_id: user.user_id,
            name: `${user.user_first_name} ${user.user_last_name}`,
            email: user.user_email,
            role: user.user_role,
          },
        },
      };
    }

    // 2. Fallback: Check in Admin Model
    const { adminSchema } = require("../../admin/models/admin.schema");
    const AdminModel = tenantConnection.models.Admin || tenantConnection.model("Admin", adminSchema, "admins");

    const admin = await AdminModel.findOne({
      $or: [
        { admin_email: login_id.toLowerCase() },
        { admin_phone: login_id },
        { admin_login_id: login_id.toLowerCase() },
      ],
      admin_is_deleted: false,
    });

    if (admin) {
      // NOTE: Admin model has status: admin_status
      if (admin.admin_status !== "active") {
        return { statusCode: 403, success: false, message: `Inactive Id | Connect with support system` };
      }

      const isPasswordValid = await passwordUtil.comparePassword(password, admin.admin_password);
      if (!isPasswordValid) {
        return { statusCode: 401, success: false, message: "Please enter a valid password." };
      }

      const tokenPayload = {
        user_id: admin.admin_id, // Generic name
        email: admin.admin_email,
        role: admin.admin_role || "admin",
      };

      const accessToken = jwtUtil.signAccessToken(tokenPayload);
      const refreshToken = jwtUtil.signRefreshToken(tokenPayload);

      admin.admin_last_login = new Date();
      await admin.save();

      return {
        statusCode: 200,
        success: true,
        message: "Logged in successfully",
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          user: {
            user_id: admin.admin_id,
            name: `${admin.admin_first_name} ${admin.admin_last_name}`,
            email: admin.admin_email,
            role: admin.admin_role || "admin",
          },
        },
      };
    }

    return { statusCode: 401, success: false, message: "Please enter a valid login ID, email, mobile no." };

  } catch (error) {
    console.error("Error in authenticateUser:", error);
    return { statusCode: 500, success: false, message: "Something went wrong. Please try again later." };
  }
}

/**
 * Refresh Token Service
 */
async function refreshAuthToken(payload) {
  const { refresh_token, tenantConnection } = payload;

  try {
    let decoded;
    try {
      decoded = jwtUtil.verifyToken(refresh_token, true);
    } catch (err) {
      return { statusCode: 401, success: false, message: "Invalid or expired refresh token" };
    }

    // Support both User and Admin based on the token's role
    const roleIsAdmin = decoded.role && (decoded.role === "admin" || decoded.role === "super_admin");

    if (roleIsAdmin) {
      const { adminSchema } = require("../../admin/models/admin.schema");
      const AdminModel = tenantConnection.models.Admin || tenantConnection.model("Admin", adminSchema, "admins");

      const admin = await AdminModel.findOne({
        admin_id: decoded.user_id,
        admin_is_deleted: false,
      });

      if (!admin || admin.admin_status !== "active") {
        return { statusCode: 401, success: false, message: "Admin not found or inactive" };
      }

      const tokenPayload = {
        user_id: admin.admin_id,
        email: admin.admin_email,
        role: admin.admin_role || "admin",
      };

      const newAccessToken = jwtUtil.signAccessToken(tokenPayload);

      return {
        statusCode: 200,
        success: true,
        data: { access_token: newAccessToken },
      };

    } else {
      const { userSchema } = require("../../user/models/user.model");
      const UserModel = tenantConnection.models.User || tenantConnection.model("User", userSchema);

      const user = await UserModel.findOne({
        user_id: decoded.user_id,
        user_is_deleted: false,
      });

      if (!user || user.user_status !== "active") {
        return { statusCode: 401, success: false, message: "User not found or inactive" };
      }

      const tokenPayload = {
        user_id: user.user_id,
        email: user.user_email,
        role: user.user_role,
      };

      const newAccessToken = jwtUtil.signAccessToken(tokenPayload);

      return {
        statusCode: 200,
        success: true,
        data: { access_token: newAccessToken },
      };
    }

  } catch (error) {
    console.error("Error in refreshAuthToken:", error);
    return { statusCode: 500, success: false, message: "Internal server error" };
  }
}

/**
 * Send OTP Service
 */
async function sendOTP(payload) {
  const { login_id, tenantConnection } = payload;

  try {
    const { userSchema } = require("../../user/models/user.model");
    const UserModel = tenantConnection.models.User || tenantConnection.model("User", userSchema);

    // 1. Check in User Model
    let user = await UserModel.findOne({
      $or: [
        { user_email: login_id.toLowerCase() },
        { user_mobile_no: login_id },
        { user_login_id: login_id.toLowerCase() },
      ],
      user_is_deleted: false,
    });

    let userEmail = "";
    let userDoc = null;

    if (user) {
      if (user.user_status !== "active") {
        return { statusCode: 403, success: false, message: `Inactive Id | Connect with support system` };
      }
      userEmail = user.user_email;
      userDoc = user;
    } else {
      // 2. Check in Admin Model
      const { adminSchema } = require("../../admin/models/admin.schema");
      const AdminModel = tenantConnection.models.Admin || tenantConnection.model("Admin", adminSchema, "admins");

      const admin = await AdminModel.findOne({
        $or: [
          { admin_email: login_id.toLowerCase() },
          { admin_phone: login_id },
          { admin_login_id: login_id.toLowerCase() },
        ],
        admin_is_deleted: false,
      });

      if (admin) {
        if (admin.admin_status !== "active") {
          return { statusCode: 403, success: false, message: `Inactive Id | Connect with support system` };
        }
        userEmail = admin.admin_email;
        userDoc = admin;
      }
    }

    if (!userDoc) {
      return { statusCode: 404, success: false, message: "Please enter a valid login ID, email, mobile no." };
    }

    // Generate OTP
    const otp = otpService.generateOTP();

    // Save OTP to database
    await otpService.saveOTP(userDoc, otp);

    // Send OTP via email
    const emailSent = await sendOTPEmail(userEmail, otp);

    if (!emailSent) {
      return { statusCode: 500, success: false, message: "Failed to send OTP email." };
    }

    return {
      statusCode: 200,
      success: true,
      message: `OTP sent successfully to your registered email.`,
    };

  } catch (error) {
    console.error("Error in sendOTP:", error);
    return { statusCode: 500, success: false, message: "Internal server error" };
  }
}

/**
 * Verify OTP and Login Service
 */
async function verifyOTPAndLogin(payload) {
  const { login_id, otp, tenantConnection } = payload;

  try {
    const { userSchema } = require("../../user/models/user.model");
    const UserModel = tenantConnection.models.User || tenantConnection.model("User", userSchema);

    // 1. Check in User Model
    let user = await UserModel.findOne({
      $or: [
        { user_email: login_id.toLowerCase() },
        { user_mobile_no: login_id },
        { user_login_id: login_id.toLowerCase() },
      ],
      user_is_deleted: false,
    });

    let userDoc = null;
    let isUser = true;

    if (user) {
      userDoc = user;
    } else {
      // 2. Check in Admin Model
      const { adminSchema } = require("../../admin/models/admin.schema");
      const AdminModel = tenantConnection.models.Admin || tenantConnection.model("Admin", adminSchema, "admins");

      const admin = await AdminModel.findOne({
        $or: [
          { admin_email: login_id.toLowerCase() },
          { admin_phone: login_id },
          { admin_login_id: login_id.toLowerCase() },
        ],
        admin_is_deleted: false,
      });

      if (admin) {
        userDoc = admin;
        isUser = false;
      }
    }

    if (!userDoc) {
      return { statusCode: 404, success: false, message: "Please enter a valid login ID, email, mobile no." };
    }

    // Verify OTP
    const verification = otpService.verifyOTP(userDoc, otp);
    if (!verification.success) {
      return { statusCode: 401, success: false, message: verification.message };
    }

    // OTP is valid, proceed to login
    const tokenPayload = isUser ? {
      user_id: userDoc.user_id,
      email: userDoc.user_email,
      role: userDoc.user_role,
    } : {
      user_id: userDoc.admin_id,
      email: userDoc.admin_email,
      role: userDoc.admin_role || "admin",
    };

    const accessToken = jwtUtil.signAccessToken(tokenPayload);
    const refreshToken = jwtUtil.signRefreshToken(tokenPayload);

    // Update last login
    if (isUser) {
      userDoc.user_last_login = new Date();
    } else {
      userDoc.admin_last_login = new Date();
    }

    // Clear OTP
    await otpService.clearOTP(userDoc);

    return {
      statusCode: 200,
      success: true,
      message: "Logged in successfully",
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: isUser ? {
          user_id: userDoc.user_id,
          name: `${userDoc.user_first_name} ${userDoc.user_last_name}`,
          email: userDoc.user_email,
          role: userDoc.user_role,
        } : {
          user_id: userDoc.admin_id,
          name: `${userDoc.admin_first_name} ${userDoc.admin_last_name}`,
          email: userDoc.admin_email,
          role: userDoc.admin_role || "admin",
        },
      },
    };

  } catch (error) {
    console.error("Error in verifyOTPAndLogin:", error);
    return { statusCode: 500, success: false, message: "Internal server error" };
  }
}

module.exports = {
  authenticateUser,
  refreshAuthToken,
  sendOTP,
  verifyOTPAndLogin,
};

