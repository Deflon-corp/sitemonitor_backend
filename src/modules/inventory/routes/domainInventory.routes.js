const express = require("express");
const router = express.Router();
const domainInventoryController = require("../controllers/domainInventory.controller");
const { authMiddleware } = require("../../../common/middlewares/auth.middleware");

// POST /api/domain/inventory/scan
router.post("/scan", authMiddleware, domainInventoryController.startScanHandler);

// GET /api/domain/inventory/status/:scanId
router.get("/status/:scanId", authMiddleware, domainInventoryController.getScanStatusHandler);

// GET /api/domain/inventory/summary/:domainId
router.get("/summary/:domainId", authMiddleware, domainInventoryController.getInventorySummaryHandler);

// GET /api/domain/inventory/details/:domainId
router.get("/details/:domainId", authMiddleware, domainInventoryController.getInventoryDetailsHandler);

// GET /api/domain/inventory/history/:domainId
router.get("/history/:domainId", authMiddleware, domainInventoryController.getInventoryHistoryHandler);

module.exports = router;
