const {
  get_all_tenants_service,
  update_tenant_service,
  delete_tenant_service,
} = require("../services/tenant.service");

/**
 * Get all tenants (super admin only).
 * Query: include_deleted=true to include soft-deleted tenants.
 */
async function get_all_tenants(req, res) {
  try {
    const result = await get_all_tenants_service({
      masterConnection: req.masterConnection,
      query: req.query,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("get_all_tenants error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tenants",
    });
  }
}

/**
 * Update tenant by tent_id (super admin only).
 */
async function update_tenant(req, res) {
  try {
    const { tent_name, tent_domain, tent_expiry_date, tent_status, tent_plan } =
      req.body || {};

    const hasAny =
      tent_name !== undefined ||
      tent_domain !== undefined ||
      tent_expiry_date !== undefined ||
      tent_status !== undefined ||
      tent_plan !== undefined;

    if (!hasAny) {
      return res.status(400).json({
        success: false,
        message: "At least one field must be provided to update",
      });
    }

    const result = await update_tenant_service({
      masterConnection: req.masterConnection,
      params: req.params,
      body: req.body,
      user: req.user,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("update_tenant error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update tenant",
    });
  }
}

/**
 * Soft delete tenant by tent_id (super admin only).
 */
async function delete_tenant(req, res) {
  try {
    const result = await delete_tenant_service({
      masterConnection: req.masterConnection,
      params: req.params,
      user: req.user,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("delete_tenant error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete tenant",
    });
  }
}

module.exports = {
  get_all_tenants,
  update_tenant,
  delete_tenant,
};
