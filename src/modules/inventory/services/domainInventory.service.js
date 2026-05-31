const mongoose = require("mongoose");
const { domainScanMasterSchema } = require("../models/domainScanMaster.schema");
const { domainPageSchema } = require("../models/domainPage.schema");
const { pageImageSchema } = require("../models/pageImage.schema");
const { pageCssSchema } = require("../models/pageCss.schema");
const { pageJsSchema } = require("../models/pageJs.schema");
const { pageDocumentSchema } = require("../models/pageDocument.schema");
const { pageEmailSchema } = require("../models/pageEmail.schema");
const { pageHeadlinkSchema } = require("../models/pageHeadlink.schema");
const { pageLinkSchema } = require("../models/pageLink.schema");
const { pageFormSchema } = require("../models/pageForm.schema");
const { pageIframeSchema } = require("../models/pageIframe.schema");
const { pageFrameSchema } = require("../models/pageFrame.schema");

const MASTER_URL = process.env.MASTER_MS_URL || "http://localhost:4100";

const getModels = (conn) => {
  return {
    DomainScanMaster: conn.model("DomainScanMaster", domainScanMasterSchema),
    DomainPage: conn.model("DomainPage", domainPageSchema),
    PageImage: conn.model("PageImage", pageImageSchema),
    PageCss: conn.model("PageCss", pageCssSchema),
    PageJs: conn.model("PageJs", pageJsSchema),
    PageDocument: conn.model("PageDocument", pageDocumentSchema),
    PageEmail: conn.model("PageEmail", pageEmailSchema),
    PageHeadlink: conn.model("PageHeadlink", pageHeadlinkSchema),
    PageLink: conn.model("PageLink", pageLinkSchema),
    PageForm: conn.model("PageForm", pageFormSchema),
    PageIframe: conn.model("PageIframe", pageIframeSchema),
    PageFrame: conn.model("PageFrame", pageFrameSchema),
  };
};

const startScan = async (domainId, domainUrl, conn) => {
  const { DomainScanMaster } = getModels(conn);

  // Check if there is already a scan running or pending
  /* 
  const existingActive = await DomainScanMaster.findOne({
    domain_id: domainId,
    status: { $in: ["pending", "scanning"] },
  });

  if (existingActive) {
    return {
      success: false,
      message: "An inventory scan is already running for this domain.",
      scanId: existingActive._id,
    };
  }
  */

  // Create a pending master scan record
  const scanMaster = await DomainScanMaster.create({
    domain_id: domainId,
    domain_url: domainUrl,
    status: "pending",
  });

  // Post job details to master queue enqueuer using native fetch
  try {
    const response = await fetch(`${MASTER_URL}/scan/inventory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        domainId,
        domainUrl,
        scanId: scanMaster._id,
        sourceDb: conn.name,
        sourceUri: process.env.DB_URL,
      })
    });

    const resData = await response.json();

    if (response.ok && resData && resData.success) {
      return {
        success: true,
        message: "Inventory scan started successfully.",
        scanId: scanMaster._id,
      };
    } else {
      throw new Error(resData?.error || "Failed to enqueue master scan job");
    }
  } catch (error) {
    // If enqueuing failed, mark local status as failed
    scanMaster.status = "failed";
    scanMaster.error_message = error.message;
    await scanMaster.save();
    throw error;
  }
};

const getScanStatus = async (scanId, conn) => {
  const { DomainScanMaster } = getModels(conn);
  const scan = await DomainScanMaster.findById(scanId);
  if (!scan) {
    throw new Error("Scan master record not found");
  }
  return scan;
};

const getInventorySummary = async (domainId, conn) => {
  const { DomainScanMaster } = getModels(conn);

  // Find the latest completed scan master
  let scan = await DomainScanMaster.findOne({
    domain_id: domainId,
    status: "completed",
  }).sort({ createdAt: -1 });

  // If no completed scan, fall back to any latest scan (even failed or scanning) to show partial counts
  if (!scan) {
    scan = await DomainScanMaster.findOne({
      domain_id: domainId,
    }).sort({ createdAt: -1 });
  }

  if (!scan) {
    return {
      hasScan: false,
      status: "none",
      totalPages: 0,
      totalImages: 0,
      totalCss: 0,
      totalJs: 0,
      totalDocuments: 0,
      totalEmails: 0,
      totalHeadlinks: 0,
      lastScanDate: null,
    };
  }

  return {
    hasScan: true,
    scanId: scan._id,
    status: scan.status,
    progress: scan.progress_percent,
    totalPages: scan.total_pages,
    totalImages: scan.total_images,
    totalCss: scan.total_css,
    totalJs: scan.total_js,
    totalDocuments: scan.total_documents,
    totalEmails: scan.total_emails,
    totalHeadlinks: scan.total_headlinks,
    lastScanDate: scan.scan_completed_at || scan.updatedAt,
  };
};

const getInventoryDetails = async (domainId, params, conn) => {
  const {
    DomainScanMaster,
    DomainPage,
    PageImage,
    PageCss,
    PageJs,
    PageDocument,
    PageEmail,
    PageHeadlink,
    PageLink,
    PageForm,
    PageIframe,
    PageFrame,
  } = getModels(conn);

  const { type, page = 1, limit = 10, search = "", sortBy, sortOrder = "asc", pageUrl } = params;

  if (!type) {
    throw new Error("Parameters type is required");
  }

  // 1. Get the latest scan master ID to align detailed data
  let scan = await DomainScanMaster.findOne({
    domain_id: domainId,
    status: "completed",
  }).sort({ createdAt: -1 });

  // Fallback to latest general scan if no completed scan exists
  if (!scan) {
    scan = await DomainScanMaster.findOne({
      domain_id: domainId,
    }).sort({ createdAt: -1 });
  }

  if (!scan) {
    return { items: [], total: 0, page, limit, totalPages: 0 };
  }

  // 2. Select Model based on asset type
  let Model;
  switch (type) {
    case "html-pages":
      Model = DomainPage;
      break;
    case "images":
      Model = PageImage;
      break;
    case "css":
      Model = PageCss;
      break;
    case "js":
      Model = PageJs;
      break;
    case "documents":
      Model = PageDocument;
      break;
    case "emails":
      Model = PageEmail;
      break;
    case "headlinks":
      Model = PageHeadlink;
      break;
    case "links":
      Model = PageLink;
      break;
    case "forms":
      Model = PageForm;
      break;
    case "iframes":
      Model = PageIframe;
      break;
    case "frames":
      Model = PageFrame;
      break;
    default:
      throw new Error(`Invalid asset type provided: ${type}`);
  }

  // 3. Build query filter
  const query = { scan_id: scan._id };
  if (pageUrl) {
    query.page_url = pageUrl;
  }

  if (search.trim()) {
    const rx = new RegExp(search.trim(), "i");
    const searchConditions = [];

    switch (type) {
      case "html-pages":
        searchConditions.push({ page_url: rx }, { page_title: rx });
        break;
      case "images":
        searchConditions.push({ page_url: rx }, { image_url: rx }, { alt_text: rx });
        break;
      case "css":
        searchConditions.push({ page_url: rx }, { css_url: rx });
        break;
      case "js":
        searchConditions.push({ page_url: rx }, { js_url: rx });
        break;
      case "documents":
        searchConditions.push({ page_url: rx }, { document_url: rx }, { document_type: rx });
        break;
      case "emails":
        searchConditions.push({ page_url: rx }, { email_address: rx });
        break;
      case "headlinks":
        searchConditions.push({ page_url: rx }, { href: rx }, { rel_type: rx });
        break;
      case "links":
        searchConditions.push({ page_url: rx }, { link_url: rx }, { anchor_text: rx }, { link_type: rx });
        break;
      case "forms":
        searchConditions.push({ page_url: rx }, { form_action: rx }, { form_method: rx });
        break;
      case "iframes":
        searchConditions.push({ page_url: rx }, { iframe_src: rx });
        break;
      case "frames":
        searchConditions.push({ page_url: rx }, { frame_src: rx });
        break;
    }

    if (searchConditions.length > 0) {
      query.$or = searchConditions;
    }
  }

  // 4. Build sort options
  let sortField = "createdAt";
  if (sortBy) {
    sortField = sortBy;
  } else {
    // Default sorts based on type
    switch (type) {
      case "html-pages":
        sortField = "page_url";
        break;
      case "images":
        sortField = "image_url";
        break;
      case "css":
        sortField = "css_url";
        break;
      case "js":
        sortField = "js_url";
        break;
      case "documents":
        sortField = "document_url";
        break;
      case "emails":
        sortField = "email_address";
        break;
      case "headlinks":
        sortField = "href";
        break;
      case "links":
        sortField = "link_url";
        break;
      case "forms":
        sortField = "form_action";
        break;
      case "iframes":
        sortField = "iframe_src";
        break;
      case "frames":
        sortField = "frame_src";
        break;
    }
  }

  const sortDirection = sortOrder === "desc" ? -1 : 1;
  const sortOptions = { [sortField]: sortDirection };

  // 5. Execute paginated query
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  const total = await Model.countDocuments(query);
  const items = await Model.find(query)
    .sort(sortOptions)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  return {
    items,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  };
};

const getInventoryHistory = async (domainId, conn) => {
  const { DomainScanMaster } = getModels(conn);

  const history = await DomainScanMaster.aggregate([
    { 
      $match: { 
        domain_id: mongoose.Types.ObjectId.isValid(domainId) ? new mongoose.Types.ObjectId(domainId) : domainId,
        status: "completed"
      } 
    },
    { $sort: { "createdAt": -1 } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        },
        doc: { $first: "$$ROOT" }
      }
    },
    { $replaceRoot: { newRoot: "$doc" } },
    { $sort: { "createdAt": -1 } },
    { $limit: 14 }
  ]);

  history.reverse();

  const formattedHistory = history.map(item => {
    return {
      htmlPages: Math.round(item.total_pages || 0),
      images: Math.round(item.total_images || 0),
      css: Math.round(item.total_css || 0),
      js: Math.round(item.total_js || 0),
      documents: Math.round(item.total_documents || 0),
      emails: Math.round(item.total_emails || 0),
      headlinks: Math.round(item.total_headlinks || 0),
      links: 0,
      forms: 0,
      iframes: 0,
      frames: 0,
      date: item.scan_completed_at || item.createdAt
    };
  });

  return formattedHistory;
};

module.exports = {
  startScan,
  getScanStatus,
  getInventorySummary,
  getInventoryDetails,
  getInventoryHistory,
};
