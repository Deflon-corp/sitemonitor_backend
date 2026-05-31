const express = require("express");
const { superAdminMiddleware } = require("../../../common/middlewares/super_admin.middleware");
const {
  get_all_tenants,
  update_tenant,
  delete_tenant,
} = require("../controllers/tenant.controller");

const router = express.Router();

// All tenant routes require super admin JWT and tenant_id=super (handled at app mount).

router.get("/", superAdminMiddleware, get_all_tenants);
router.put("/:tent_id", superAdminMiddleware, update_tenant);
router.delete("/:tent_id", superAdminMiddleware, delete_tenant);

module.exports = router;
