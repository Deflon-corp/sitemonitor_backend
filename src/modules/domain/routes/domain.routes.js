const express = require("express");
const { authMiddleware } = require("../../../common/middlewares/auth.middleware");
const {
  create_domain,
  get_domain_list,
  get_domain_by_id,
  update_domain,
  delete_domain,
  archive_domain,
  restore_domain,
  hard_delete_domain,
  get_domain_scan_history,
  get_latest_domain_summary,
  trigger_domain_scan,
  get_domain_seo_pages,
  get_domain_seo_checkpoints,
  get_domain_audit_data,
} = require("../controllers/domain.controller");

const router = express.Router();

// All domain routes require authentication
router.use(authMiddleware);

// Create domain
router.post("/", create_domain);

// Get list of domains
router.get("/", get_domain_list);

// Get domain by ID
router.get("/:id", get_domain_by_id);

// Update domain
router.put("/:id", update_domain);

// Delete domain (soft delete)
router.delete("/:id", delete_domain);

// Archive domain
router.post("/archive/:id", archive_domain);

// Restore domain
router.post("/restore/:id", restore_domain);

// Hard delete domain
router.delete("/hard-delete/:id", hard_delete_domain);
 
// Scan History
router.get("/:id/scan-history", get_domain_scan_history);
 
// Latest Summary
router.get("/:id/latest-summary", get_latest_domain_summary);

// SEO Pages
router.get("/:id/seo-pages", get_domain_seo_pages);

// SEO Checkpoints
router.get("/:id/seo-checkpoints", get_domain_seo_checkpoints);
 
// Audit Data
router.get("/:id/audit-data", get_domain_audit_data);

// Trigger Scan
router.post("/:id/scan", trigger_domain_scan);

module.exports = router;
