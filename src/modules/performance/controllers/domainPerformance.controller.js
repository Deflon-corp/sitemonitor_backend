const performanceService = require("../services/domainPerformance.service");

async function getSummary(req, res) {
  try {
    const { domainId } = req.params;
    const tenantConnection = req.tenantConnection;

    const result = await performanceService.getPerformanceSummary({
      tenantConnection,
      domainId
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("Error in getSummary performance controller:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function getPages(req, res) {
  try {
    const { domainId } = req.params;
    const tenantConnection = req.tenantConnection;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "score";
    const sortOrder = req.query.sortOrder || "desc";

    const result = await performanceService.getPerformancePages({
      tenantConnection,
      domainId,
      page,
      limit,
      search,
      sortBy,
      sortOrder
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("Error in getPages performance controller:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}


async function getHistory(req, res) {
  try {
    const { domainId } = req.params;
    const url = req.query.url;
    const tenantConnection = req.tenantConnection;

    const result = await performanceService.getPerformanceHistory({
      tenantConnection,
      domainId,
      url
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("Error in getHistory performance controller:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

module.exports = {
  getHistory,
  getSummary,
  getPages
};
