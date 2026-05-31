const express = require("express");
const { authRateLimiter } = require("../../../common/middlewares/security.middleware");
const { superAdminMiddleware } = require("../../../common/middlewares/super_admin.middleware");
const {
  create_super_admin,
  update_super_admin,
  delete_super_admin,
  login_super_admin,
  refresh_super_admin_token,
} = require("../controllers/super_admin.controller");

const router = express.Router();

// All super admin routes are mounted at app level with:
// - superTenantMiddleware to use fixed master "super" tenant connection
// - apiRateLimiter for basic rate limiting

// Create super admin (NO login/auth required – bootstrap endpoint)
router.post("/", create_super_admin);

// Update super admin (requires super admin JWT)
router.put("/:sa_id", superAdminMiddleware, update_super_admin);

// Delete super admin (soft delete, requires super admin JWT)
router.delete("/:sa_id", superAdminMiddleware, delete_super_admin);

// Login super admin (rate-limited, only validates fixed tenant_id = "super")
router.post("/login", authRateLimiter, login_super_admin);

// Refresh tokens (rate-limited) - expects refresh token in Authorization header
router.post("/refresh", authRateLimiter, refresh_super_admin_token);

module.exports = router;

