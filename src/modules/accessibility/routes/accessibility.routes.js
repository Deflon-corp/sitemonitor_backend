const express = require("express");
const router = express.Router();
const accessibilityController = require("../controllers/accessibility.controller");

router.get("/:domainId/summary", accessibilityController.getSummary);
router.get("/:domainId/page-detail", accessibilityController.getPageDetail);
router.get("/:domainId/pages", accessibilityController.getPages);
router.get("/:domainId/status", accessibilityController.getScanStatus);
router.post("/:domainId/trigger", accessibilityController.triggerScan);

module.exports = router;
