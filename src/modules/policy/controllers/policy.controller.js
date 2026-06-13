const {
  create_policy_service,
  get_policy_list_service,
  get_policy_by_id_service,
  update_policy_service,
  delete_policy_service,
  get_policy_stats_service,
  get_policy_reports_service,
  get_policy_content_matches_service,
  scan_domain_policies_service,
} = require("../services/policy.service");

/**
 * create_policy
 */
async function create_policy(req, res) {
  try {
    const result = await create_policy_service({
      tenantConnection: req.tenantConnection,
      body: req.body,
      tenantId: req.tenantId,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("create_policy controller error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * get_policy_list
 */
async function get_policy_list(req, res) {
  try {
    const result = await get_policy_list_service({
      tenantConnection: req.tenantConnection,
      query: req.query,
      tenantId: req.tenantId,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("get_policy_list controller error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * get_policy_by_id
 */
async function get_policy_by_id(req, res) {
  try {
    const result = await get_policy_by_id_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("get_policy_by_id controller error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * update_policy
 */
async function update_policy(req, res) {
  try {
    const result = await update_policy_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
      body: req.body,
      tenantId: req.tenantId,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("update_policy controller error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * delete_policy
 */
async function delete_policy(req, res) {
  try {
    const result = await delete_policy_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("delete_policy controller error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * get_policy_stats
 */
async function get_policy_stats(req, res) {
  try {
    const result = await get_policy_stats_service({
      tenantConnection: req.tenantConnection,
      query: req.query,
      tenantId: req.tenantId,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("get_policy_stats controller error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function get_policy_reports(req, res) {
  try {
    const result = await get_policy_reports_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
      query: req.query,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("get_policy_reports controller error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function get_policy_content_matches(req, res) {
  try {
    const result = await get_policy_content_matches_service({
      tenantConnection: req.tenantConnection,
      query: req.query,
      tenantId: req.tenantId,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("get_policy_content_matches controller error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function scan_domain_policies(req, res) {
  try {
    const result = await scan_domain_policies_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
      tenantId: req.tenantId,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("scan_domain_policies controller error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  create_policy,
  get_policy_list,
  get_policy_by_id,
  update_policy,
  delete_policy,
  get_policy_stats,
  get_policy_reports,
  get_policy_content_matches,
  scan_domain_policies,
};
