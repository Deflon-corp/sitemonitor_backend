const { ruleSchema } = require("../models/rule.schema");

const get_rule_model = (connection) => {
  return connection.models.Rule || connection.model("Rule", ruleSchema);
};

/**
 * create_rule_service
 */
async function create_rule_service({ tenantConnection, body, tenantId }) {
  try {
    const Rule = get_rule_model(tenantConnection);
    const newRule = new Rule({
      ...body,
      tenantId,
    });
    await newRule.save();

    return {
      success: true,
      statusCode: 201,
      message: "Rule created successfully",
      data: newRule,
    };
  } catch (err) {
    console.error("create_rule_service error:", err);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to create rule",
    };
  }
}

/**
 * get_rules_by_policy_service
 */
async function get_rules_by_policy_service({ tenantConnection, policyId, tenantId }) {
  try {
    const Rule = get_rule_model(tenantConnection);
    const rules = await Rule.find({ policyId, tenantId, is_deleted: false });

    return {
      success: true,
      statusCode: 200,
      message: "Rules retrieved successfully",
      data: rules,
    };
  } catch (err) {
    console.error("get_rules_by_policy_service error:", err);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to retrieve rules",
    };
  }
}

/**
 * delete_rules_by_policy_service
 */
async function delete_rules_by_policy_service({ tenantConnection, policyId }) {
  try {
    const Rule = get_rule_model(tenantConnection);
    await Rule.updateMany({ policyId }, { $set: { is_deleted: true } });

    return {
      success: true,
      statusCode: 200,
      message: "Rules deleted successfully",
    };
  } catch (err) {
    console.error("delete_rules_by_policy_service error:", err);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to delete rules",
    };
  }
}

module.exports = {
  create_rule_service,
  get_rules_by_policy_service,
  delete_rules_by_policy_service,
};
