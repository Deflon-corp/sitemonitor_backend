const express = require("express");
const { get_heartbeat_data } = require("../controllers/heartbeat.controller");

const router = express.Router();

router.get("/:domainId", get_heartbeat_data);

module.exports = router;
