const domainInventoryService = require("../services/domainInventory.service");

const startScanHandler = async (req, res) => {
  try {
    const { domain_id, domain_url } = req.body;
    if (!domain_id || !domain_url) {
      return res.status(400).json({ success: false, error: "domain_id and domain_url are required" });
    }

    const result = await domainInventoryService.startScan(domain_id, domain_url, req.tenantConnection);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getScanStatusHandler = async (req, res) => {
  try {
    const { scanId } = req.params;
    if (!scanId) {
      return res.status(400).json({ success: false, error: "scanId parameter is required" });
    }

    const result = await domainInventoryService.getScanStatus(scanId, req.tenantConnection);
    return res.status(200).json({ success: true, scan: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getInventorySummaryHandler = async (req, res) => {
  try {
    const { domainId } = req.params;
    if (!domainId) {
      return res.status(400).json({ success: false, error: "domainId parameter is required" });
    }

    const result = await domainInventoryService.getInventorySummary(domainId, req.tenantConnection);
    return res.status(200).json({ success: true, summary: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getInventoryDetailsHandler = async (req, res) => {
  try {
    const { domainId } = req.params;
    const { type, page, limit, search, sortBy, sortOrder, pageUrl } = req.query;

    if (!domainId) {
      return res.status(400).json({ success: false, error: "domainId parameter is required" });
    }
    if (!type) {
      return res.status(400).json({ success: false, error: "type parameter is required (e.g. html-pages, images, etc.)" });
    }

    const params = {
      type,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search: search || "",
      sortBy: sortBy || "",
      sortOrder: sortOrder || "asc",
      pageUrl,
    };

    const result = await domainInventoryService.getInventoryDetails(domainId, params, req.tenantConnection);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getInventoryHistoryHandler = async (req, res) => {
  try {
    const { domainId } = req.params;
    if (!domainId) {
      return res.status(400).json({ success: false, error: "domainId parameter is required" });
    }

    const result = await domainInventoryService.getInventoryHistory(domainId, req.tenantConnection);
    return res.status(200).json({ success: true, history: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  startScanHandler,
  getScanStatusHandler,
  getInventorySummaryHandler,
  getInventoryDetailsHandler,
  getInventoryHistoryHandler,
};
