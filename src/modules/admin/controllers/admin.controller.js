const {
  create_admin_service,
  create_tenant_and_admin_service,
  update_admin_service,
  delete_admin_service,
  login_admin_service,
  refresh_admin_token_service,
  get_admin_list_service,
} = require("../services/admin.service");
const { getBearerToken } = require("../../../common/middlewares/auth.middleware");

/**
 * create_admin
 * When body has tenant_name + tenant_domain: creates new tenant (and DB) + admin, uses masterConnection.
 * Otherwise: creates admin in existing tenant (tenant_id header), uses tenantConnection.
 * Body (new tenant): { tenant_name, tenant_domain, admin_first_name, admin_father_name, admin_last_name, admin_email, admin_phone, admin_password }
 * Body (existing tenant): { admin_first_name, admin_father_name, admin_last_name, admin_email, admin_phone, admin_password }
 */
async function create_admin(req, res) {
  try {
    const isCreateTenantAndAdmin =
      req.createTenantAndAdmin && req.masterConnection;

    if (isCreateTenantAndAdmin) {
      const { tenant_name, tenant_domain } = req.body || {};
      if (!tenant_name || !tenant_domain) {
        return res.status(400).json({
          success: false,
          message: "tenant_name and tenant_domain are required",
        });
      }
      const result = await create_tenant_and_admin_service({
        masterConnection: req.masterConnection,
        body: req.body,
        file: req.file,
      });
      return res.status(result.statusCode).json(result);
    }

    const {
      admin_first_name,
      admin_father_name,
      admin_last_name,
      admin_email,
      admin_phone,
      admin_password,
    } = req.body || {};

    if (
      !admin_first_name ||
      !admin_father_name ||
      !admin_last_name ||
      !admin_email ||
      !admin_phone ||
      !admin_password
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const result = await create_admin_service({
      tenantConnection: req.tenantConnection,
      body: req.body,
      file: req.file,
      user: req.user,
      tenantId: req.tenantId,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("create_admin error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create admin",
    });
  }
}

/**
 * update_admin
 * Params: :admin_id
 * Body: any updatable fields (first_name, father_name, last_name, email, phone, password)
 */
async function update_admin(req, res) {
  try {
    const {
      admin_first_name,
      admin_father_name,
      admin_last_name,
      admin_email,
      admin_phone,
      admin_password,
    } = req.body || {};

    if (
      !admin_first_name &&
      !admin_father_name &&
      !admin_last_name &&
      !admin_email &&
      !admin_phone &&
      !admin_password
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field must be provided to update",
      });
    }

    const result = await update_admin_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
      body: req.body,
      file: req.file,
      user: req.user,
      tenantId: req.tenantId,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("update_admin error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update admin",
    });
  }
}

/**
 * delete_admin
 * Params: :admin_id
 * Soft delete: sets admin_is_deleted = true and admin_deleted_at/by
 */
async function delete_admin(req, res) {
  try {
    const result = await delete_admin_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
      user: req.user,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("delete_admin error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete admin",
    });
  }
}

/**
 * login_admin
 * Body: { login_id, login_password }
 */
async function login_admin(req, res) {
  try {
    const { login_id, login_password, admin_email, admin_password } = req.body || {};

    const id = login_id || admin_email;
    const password = login_password || admin_password;

    if (!id || !password) {
      return res.status(400).json({
        success: false,
        message: "login_id and login_password are required",
      });
    }

    const result = await login_admin_service({
      tenantConnection: req.tenantConnection,
      body: req.body,
      tenantId: req.tenantId,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("login_admin error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to login admin",
    });
  }
}

/**
 * refresh_admin_token
 * Header: Authorization: Bearer <refresh_token>
 */
async function refresh_admin_token(req, res) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    const result = await refresh_admin_token_service({
      tenantConnection: req.tenantConnection,
      token,
      tenantId: req.tenantId,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("refresh_admin_token error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh token",
    });
  }
}

/**
 * get_admin_list
 * Query: { page, limit, admin_status, search }
 */
async function get_admin_list(req, res) {
  try {
    const result = await get_admin_list_service({
      tenantConnection: req.tenantConnection,
      query: req.query,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("get_admin_list error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve admins",
    });
  }
}

module.exports = {
  create_admin,
  update_admin,
  delete_admin,
  login_admin,
  refresh_admin_token,
  get_admin_list,
};

