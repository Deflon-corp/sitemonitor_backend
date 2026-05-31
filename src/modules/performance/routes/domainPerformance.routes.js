const express = require("express");
const router = express.Router();
const performanceController = require("../controllers/domainPerformance.controller");
const { authMiddleware } = require("../../../common/middlewares/auth.middleware");

router.get("/summary/:domainId", authMiddleware, performanceController.getSummary);
router.get("/pages/:domainId", authMiddleware, performanceController.getPages);

router.get("/history/:domainId", authMiddleware, performanceController.getHistory);

module.exports = router;
