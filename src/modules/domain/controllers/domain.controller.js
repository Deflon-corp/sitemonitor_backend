const {
  create_domain_service,
  get_domain_list_service,
  get_domain_by_id_service,
  update_domain_service,
  delete_domain_service,
  archive_domain_service,
  restore_domain_service,
  hard_delete_domain_service,
  get_domain_scan_history_service,
  get_latest_domain_summary_service,
  get_domain_seo_pages_service,
  get_domain_seo_checkpoints_service,
  trigger_domain_scan_service,
  get_domain_audit_data_service,
} = require("../services/domain.service");

/**
 * create_domain
 */
async function create_domain(req, res) {
  try {
    const { dm_title, dm_url } = req.body || {};

    if (!dm_title || !dm_url) {
      return res.status(400).json({
        success: false,
        message: "dm_title and dm_url are required",
      });
    }

    const result = await create_domain_service({
      tenantConnection: req.tenantConnection,
      body: req.body,
      user: req.user,
      tenantId: req.tenantId,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("create_domain error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create domain",
    });
  }
}

/**
 * get_domain_list
 */
async function get_domain_list(req, res) {
  try {
    const result = await get_domain_list_service({
      tenantConnection: req.tenantConnection,
      query: req.query,
      tenantId: req.tenantId,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("get_domain_list error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve domain list",
    });
  }
}

/**
 * get_domain_by_id
 */
async function get_domain_by_id(req, res) {
  try {
    const result = await get_domain_by_id_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
      tenantId: req.tenantId,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("get_domain_by_id error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve domain",
    });
  }
}

/**
 * update_domain
 */
async function update_domain(req, res) {
  try {
    const result = await update_domain_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
      body: req.body,
      user: req.user,
      tenantId: req.tenantId,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("update_domain error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update domain",
    });
  }
}

/**
 * delete_domain
 */
async function delete_domain(req, res) {
  try {
    const result = await delete_domain_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
      user: req.user,
      tenantId: req.tenantId,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("delete_domain error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete domain",
    });
  }
}

/**
 * archive_domain
 */
async function archive_domain(req, res) {
  try {
    const result = await archive_domain_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
      user: req.user,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("archive_domain error:", err);
    return res.status(500).json({ success: false, message: "Failed to archive domain" });
  }
}

/**
 * restore_domain
 */
async function restore_domain(req, res) {
  try {
    const result = await restore_domain_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
      user: req.user,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("restore_domain error:", err);
    return res.status(500).json({ success: false, message: "Failed to restore domain" });
  }
}

/**
 * hard_delete_domain
 */
async function hard_delete_domain(req, res) {
  try {
    const result = await hard_delete_domain_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
      user: req.user,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("hard_delete_domain error:", err);
    return res.status(500).json({ success: false, message: "Failed to permanently delete domain" });
  }
}

/**
 * get_domain_scan_history
 */
async function get_domain_scan_history(req, res) {
  try {
    const result = await get_domain_scan_history_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("get_domain_scan_history error:", err);
    return res.status(500).json({ success: false, message: "Failed to retrieve scan history" });
  }
}

/**
 * get_latest_domain_summary
 */
async function get_latest_domain_summary(req, res) {
  try {
    const result = await get_latest_domain_summary_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("get_latest_domain_summary error:", err);
    return res.status(500).json({ success: false, message: "Failed to retrieve latest summary" });
  }
}

/**
 * get_domain_seo_pages
 */
async function get_domain_seo_pages(req, res) {
  try {
    const result = await get_domain_seo_pages_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
      query: req.query
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("get_domain_seo_pages error:", err);
    return res.status(500).json({ success: false, message: "Failed to retrieve SEO pages" });
  }
}

/**
 * get_domain_seo_checkpoints
 */
async function get_domain_seo_checkpoints(req, res) {
  try {
    const result = await get_domain_seo_checkpoints_service({
      tenantConnection: req.tenantConnection,
      params: req.params
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("get_domain_seo_checkpoints error:", err);
    return res.status(500).json({ success: false, message: "Failed to retrieve SEO checkpoints" });
  }
}

/**
 * trigger_domain_scan
 */
async function trigger_domain_scan(req, res) {
  try {
    const result = await trigger_domain_scan_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
      user: req.user,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("trigger_domain_scan error:", err);
    return res.status(500).json({ success: false, message: "Failed to trigger scan" });
  }
}

/**
 * get_domain_audit_data
 */
async function get_domain_audit_data(req, res) {
  try {
    const result = await get_domain_audit_data_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error('get_domain_audit_data error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit data' });
  }
}

module.exports = {
  create_domain,
  get_domain_list,
  get_domain_by_id,
  update_domain,
  delete_domain,
  archive_domain,
  restore_domain,
  hard_delete_domain,
  get_domain_scan_history,
  get_latest_domain_summary,
  get_domain_seo_pages,
  get_domain_seo_checkpoints,
  trigger_domain_scan,
  get_domain_audit_data,
};
