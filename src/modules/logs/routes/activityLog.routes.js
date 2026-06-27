const express = require("express");
const router = express.Router();
const { getLogs, deleteLogs } = require("../controllers/activityLog.controller");
const { authMiddleware } = require("../../../common/middlewares/auth.middleware");

router.use(authMiddleware);

router.get("/", getLogs);
router.delete("/", deleteLogs);

module.exports = router;
