const accessibilityService = require("../services/accessibility.service");

async function getSummary(req, res) {
  try {
    const result = await accessibilityService.get_accessibility_summary_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("Accessibility getSummary error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// getAccessibilityPages was removed

async function getPageDetail(req, res) {
  try {
    const result = await accessibilityService.get_accessibility_page_detail_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
      pageUrl: req.query.pageUrl || req.query.url || "",
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("Accessibility getPageDetail error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function getPages(req, res) {
  try {
    const result = await accessibilityService.get_accessibility_pages_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      search: req.query.search || "",
      sortBy: req.query.sortBy || "url",
      sortOrder: req.query.sortOrder || "asc",
      filter: req.query.filter || "all",
      issueId: req.query.issueId || null,
      guidelineId: req.query.guidelineId || null,
      issueType: req.query.issueType || null,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("Accessibility getPages error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function triggerScan(req, res) {
  try {
    const result = await accessibilityService.trigger_accessibility_scan_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("Accessibility triggerScan error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function getScanStatus(req, res) {
  try {
    const result = await accessibilityService.get_accessibility_scan_status_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("Accessibility getScanStatus error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

module.exports = {
  getSummary,
  getPageDetail,
  getPages,
  triggerScan,
  getScanStatus,
};
