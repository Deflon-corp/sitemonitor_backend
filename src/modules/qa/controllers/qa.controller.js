const qaService = require("../services/qa.service");

async function getSummary(req, res) {
  try {
    const result = await qaService.get_qa_summary_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("QA getSummary error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function getPageDetail(req, res) {
  try {
    const result = await qaService.get_qa_page_detail_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
      pageUrl: req.query.pageUrl || req.query.url || "",
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("QA getPageDetail error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function getPages(req, res) {
  try {
    const result = await qaService.get_qa_pages_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      search: req.query.search || "",
      sortBy: req.query.sortBy || "url",
      sortOrder: req.query.sortOrder || "asc",
      filter: req.query.filter || "all",
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("QA getPages error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function getBrokenLinks(req, res) {
  try {
    const result = await qaService.get_qa_broken_links_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      search: req.query.search || "",
      sortBy: req.query.sortBy || "url",
      sortOrder: req.query.sortOrder || "desc",
      tab: req.query.tab || "all",
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("QA getBrokenLinks error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function getBrokenLinksSitemap(req, res) {
  try {
    const result = await qaService.get_qa_broken_links_sitemap_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      search: req.query.search || "",
      tab: req.query.tab || "all",
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("QA getBrokenLinksSitemap error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function getBrokenImages(req, res) {
  try {
    const result = await qaService.get_qa_broken_images_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      search: req.query.search || "",
      sortBy: req.query.sortBy || "url",
      sortOrder: req.query.sortOrder || "desc",
      tab: req.query.tab || "all",
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("QA getBrokenImages error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function getMisspellings(req, res) {
  try {
    const result = await qaService.get_qa_misspellings_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      search: req.query.search || "",
      potential: req.query.potential === "true",
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("QA getMisspellings error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function getSpellcheckSummary(req, res) {
  try {
    const result = await qaService.get_qa_spellcheck_summary_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("QA getSpellcheckSummary error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function getReadability(req, res) {
  try {
    const result = await qaService.get_qa_readability_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("QA getReadability error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function getReadabilityPages(req, res) {
  try {
    const result = await qaService.get_qa_readability_pages_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
      level: req.query.level || "",
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      search: req.query.search || "",
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("QA getReadabilityPages error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function getBrokenLinkPages(req, res) {
  try {
    const result = await qaService.get_qa_broken_link_pages_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
      href: decodeURIComponent(req.query.href || ""),
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("QA getBrokenLinkPages error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function patchLinkStatus(req, res) {
  try {
    const result = await qaService.patch_qa_link_status_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
      href: decodeURIComponent(req.body.href || ""),
      isFixed: req.body.isFixed,
      isIgnored: req.body.isIgnored,
      type: req.body.type || "link",
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("QA patchLinkStatus error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function triggerQaScan(req, res) {
  try {
    const result = await qaService.trigger_qa_scan_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("QA triggerQaScan error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function getScanStatus(req, res) {
  try {
    const result = await qaService.get_qa_scan_status_service({
      tenantConnection: req.tenantConnection,
      domainId: req.params.domainId,
    });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("QA getScanStatus error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

module.exports = {
  getSummary,
  getPageDetail,
  getPages,
  getBrokenLinks,
  getBrokenLinksSitemap,
  getBrokenImages,
  getMisspellings,
  getSpellcheckSummary,
  getReadability,
  getReadabilityPages,
  getBrokenLinkPages,
  patchLinkStatus,
  triggerQaScan,
  getScanStatus,
};
