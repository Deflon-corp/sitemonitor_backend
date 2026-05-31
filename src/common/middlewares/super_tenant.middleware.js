const { getMasterConnection } = require("../../config/mongooseMaster");

/**
 * Middleware to:
 * - Allow only a fixed tenant_id header value: "super"
 * - Attach master DB connection for super admin operations
 */
async function superTenantMiddleware(req, res, next) {
  const tenantId = req.header("tenant_id");

  if (!tenantId) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: "tenant_id header is required",
    });
  }

  if (String(tenantId).trim().toLowerCase() !== "super") {
    return res.status(403).json({
      success: false,
      status: 403,
      message: "Invalid tenant_id for super admin",
    });
  }

  try {
    const connection = await getMasterConnection();
    req.tenantId = "super";
    req.masterConnection = connection;
    next();
  } catch (err) {
    console.error("Failed to get master connection:", err);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Unable to connect to master database",
      error: process.env.NODE_ENV === "LOCAL" ? err.message : undefined,
    });
  }
}

module.exports = {
  superTenantMiddleware,
};

