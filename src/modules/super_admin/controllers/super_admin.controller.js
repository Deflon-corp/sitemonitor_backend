const {
  create_super_admin_service,
  update_super_admin_service,
  delete_super_admin_service,
  login_super_admin_service,
  refresh_super_admin_token_service,
} = require("../services/super_admin.service");
const { getBearerToken } = require("../../../common/middlewares/auth.middleware");

/**
 * create_super_admin
 * Body: { sa_first_name, sa_father_name, sa_last_name, sa_email, sa_phone, sa_password }
 */
async function create_super_admin(req, res) {
  try {
    const {
      sa_first_name,
      sa_father_name,
      sa_last_name,
      sa_email,
      sa_phone,
      sa_password,
    } = req.body || {};

    if (
      !sa_first_name ||
      !sa_father_name ||
      !sa_last_name ||
      !sa_email ||
      !sa_phone ||
      !sa_password
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const result = await create_super_admin_service({
      masterConnection: req.masterConnection,
      body: req.body,
      user: req.user,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("create_super_admin error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create super admin",
    });
  }
}

/**
 * update_super_admin
 * Params: :sa_id
 * Body: any updatable fields
 */
async function update_super_admin(req, res) {
  try {
    const {
      sa_first_name,
      sa_father_name,
      sa_last_name,
      sa_email,
      sa_phone,
      sa_password,
    } = req.body || {};

    if (
      !sa_first_name &&
      !sa_father_name &&
      !sa_last_name &&
      !sa_email &&
      !sa_phone &&
      !sa_password
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field must be provided to update",
      });
    }

    const result = await update_super_admin_service({
      masterConnection: req.masterConnection,
      params: req.params,
      body: req.body,
      user: req.user,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("update_super_admin error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update super admin",
    });
  }
}

/**
 * delete_super_admin
 * Params: :sa_id
 * Soft delete: sets sa_is_deleted = true and sa_deleted_at/by
 */
async function delete_super_admin(req, res) {
  try {
    const result = await delete_super_admin_service({
      masterConnection: req.masterConnection,
      params: req.params,
      user: req.user,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("delete_super_admin error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete super admin",
    });
  }
}

/**
 * login_super_admin
 * Body: { login_id, login_password }
 */
async function login_super_admin(req, res) {
  try {
    const { login_id, login_password, sa_email, sa_password } = req.body || {};

    const id = login_id || sa_email;
    const password = login_password || sa_password;

    if (!id || !password) {
      return res.status(400).json({
        success: false,
        message: "login_id and login_password are required",
      });
    }

    const result = await login_super_admin_service({
      masterConnection: req.masterConnection,
      body: req.body,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("login_super_admin error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to login super admin",
    });
  }
}

/**
 * refresh_super_admin_token
 * Header: Authorization: Bearer <refresh_token>
 */
async function refresh_super_admin_token(req, res) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    const result = await refresh_super_admin_token_service({
      masterConnection: req.masterConnection,
      token,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("refresh_super_admin_token error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh token",
    });
  }
}

module.exports = {
  create_super_admin,
  update_super_admin,
  delete_super_admin,
  login_super_admin,
  refresh_super_admin_token,
};

