const express = require("express");
const { authRateLimiter } = require("../../../common/middlewares/security.middleware");
const { superAdminMiddleware } = require("../../../common/middlewares/super_admin.middleware");
const {
  create_admin,
  update_admin,
  delete_admin,
  login_admin,
  refresh_admin_token,
  get_admin_list,
  get_admin_by_id,
} = require("../controllers/admin.controller");

const router = express.Router();
const uploadMiddleware = require("../../../common/middlewares/upload.middleware");

router.post("/", superAdminMiddleware, uploadMiddleware.single("profile_image"), create_admin);

// Get all admins (requires logged-in super admin)
router.get("/", superAdminMiddleware, get_admin_list);

// Get single admin by ID
router.get("/:admin_id", get_admin_by_id);

// Update admin
router.put("/:admin_id", uploadMiddleware.single("profile_image"), update_admin);

// Delete admin (soft delete)
router.delete("/:admin_id", delete_admin);

// Login admin (rate-limited)
router.post("/login", authRateLimiter, login_admin);

// Refresh tokens (rate-limited) - expects refresh token in Authorization header
router.post("/refresh", authRateLimiter, refresh_admin_token);

module.exports = router;

