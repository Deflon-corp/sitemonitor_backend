const express = require("express");
const { authMiddleware } = require("../../../common/middlewares/auth.middleware");
const {
  create_policy,
  get_policy_list,
  get_policy_by_id,
  update_policy,
  delete_policy,
  get_policy_stats,
  get_policy_reports,
  get_policy_content_matches,
  scan_domain_policies,
} = require("../controllers/policy.controller");


const router = express.Router();

// All policy routes require authentication
router.use(authMiddleware);

// Create policy
router.post("/", create_policy);

// Get list of policies
router.get("/", get_policy_list);

// Get policy stats
router.get("/stats", get_policy_stats);

// Get content matches (pages with policy hits)
router.get("/content-matches", get_policy_content_matches);

// Trigger a scan for a domain's policies
router.post("/scan/:domainId", scan_domain_policies);


// Get policy by ID
router.get("/:id", get_policy_by_id);

// Get policy reports (hits) for a policy
router.get("/:id/reports", get_policy_reports);

// Update policy
router.put("/:id", update_policy);

// Delete policy
router.delete("/:id", delete_policy);

module.exports = router;
