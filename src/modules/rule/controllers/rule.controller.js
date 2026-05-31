const {
  create_rule_service,
  get_rules_by_policy_service,
} = require("../services/rule.service");

async function create_rule(req, res) {
  const result = await create_rule_service({
    tenantConnection: req.tenantConnection,
    body: req.body,
    tenantId: req.tenantId,
  });
  return res.status(result.statusCode).json(result);
}

async function get_rules_by_policy(req, res) {
  const result = await get_rules_by_policy_service({
    tenantConnection: req.tenantConnection,
    policyId: req.params.policyId,
    tenantId: req.tenantId,
  });
  return res.status(result.statusCode).json(result);
}

module.exports = {
  create_rule,
  get_rules_by_policy,
};
