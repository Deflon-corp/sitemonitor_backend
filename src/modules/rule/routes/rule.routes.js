const express = require("express");
const { authMiddleware } = require("../../../common/middlewares/auth.middleware");
const {
  create_rule,
  get_rules_by_policy,
} = require("../controllers/rule.controller");

const router = express.Router();

router.use(authMiddleware);

router.post("/", create_rule);
router.get("/policy/:policyId", get_rules_by_policy);

module.exports = router;
