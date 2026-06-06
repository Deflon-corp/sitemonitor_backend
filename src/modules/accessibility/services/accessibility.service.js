const mongoose = require("mongoose");

function getModels(connection) {
  const { domainSchema } = require("../../domain/models/domain.schema");
  const { accessibilityReportSchema } = require("../models/accessibilityReport.schema");
  const { accessibilitySummarySchema } = require("../models/accessibilitySummary.schema");

  return {
    Domain: connection.models.Domain || connection.model("Domain", domainSchema, "domains"),
    AccessibilityReport:
      connection.models.AccessibilityReport ||
      connection.model("AccessibilityReport", accessibilityReportSchema, "accessibility_reports"),
    AccessibilitySummary:
      connection.models.AccessibilitySummary ||
      connection.model("AccessibilitySummary", accessibilitySummarySchema, "accessibility_summaries"),
  };
}

function getHostFromUrl(url) {
  if (!url) return "";
  return url
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/[/\\]+.*$/, "");
}

async function resolveDomain(Domain, domainId) {
  return Domain.findOne({
    $or: [
      { _id: mongoose.Types.ObjectId.isValid(domainId) ? domainId : null },
      { dm_id: !Number.isNaN(Number(domainId)) ? Number(domainId) : null },
    ],
    dm_is_deleted: false,
  }).lean();
}

async function getLatestJobId(AccessibilitySummary, host) {
  const summary = await AccessibilitySummary.findOne({ domain: host }).sort({ scanDate: -1 }).lean();
  return summary?.jobId || null;
}

function buildPagination(page, limit, total) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, pages };
}

async function get_accessibility_summary_service({ tenantConnection, domainId }) {
  const { Domain, AccessibilitySummary } = getModels(tenantConnection);
  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  const host = getHostFromUrl(domainDoc.dm_url);
  const summary = await AccessibilitySummary.findOne({ domain: host }).sort({ scanDate: -1 }).lean();

  if (!summary) {
    return {
      statusCode: 200,
      success: true,
      data: null,
      message: "No Accessibility scan data available. Run a scan first.",
    };
  }

  return {
    statusCode: 200,
    success: true,
    data: {
      ...summary,
      domainHost: summary.domain || host,
      domainDoc,
    },
  };
}

async function get_accessibility_pages_service({
  tenantConnection,
  domainId,
  page = 1,
  limit = 10,
  search = "",
  sortBy = "url",
  sortOrder = "asc",
  filter = "all",
  issueId = null,
  guidelineId = null,
  issueType = null,
}) {
  const { Domain, AccessibilityReport, AccessibilitySummary } = getModels(tenantConnection);
  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  const host = getHostFromUrl(domainDoc.dm_url);
  const jobId = await getLatestJobId(AccessibilitySummary, host);
  if (!jobId) {
    return {
      statusCode: 200,
      success: true,
      data: { pages: [], pagination: buildPagination(page, limit, 0) },
      message: "No Accessibility scan data",
    };
  }

  const query = { domain: host, jobId };

  if (filter === "failed") {
    query.$or = [{ failedCount: { $gt: 0 } }, { "issues.0": { $exists: true } }];
  } else if (filter === "passed") {
    query.failedCount = 0;
    query.issues = { $size: 0 };
  }

  if (issueId) {
    if (filter === "passed_issue") {
      query["passes.id"] = issueId;
    } else {
      query["issues.id"] = issueId;
    }
  } else if (guidelineId) {
    // guidelineId is e.g. "1.1.1" -> format to "wcag111"
    const tag = "wcag" + guidelineId.replace(/\./g, "");
    
    // Map issueType to axe-core impact
    let impacts = ["critical", "serious", "moderate", "minor"];
    if (issueType === "error") impacts = ["critical", "serious"];
    else if (issueType === "warning") impacts = ["moderate"];
    else if (issueType === "review") impacts = ["minor"];

    // Find documents where at least one issue has the tag AND matches the impact
    query.issues = {
      $elemMatch: {
        tags: tag,
        impact: { $in: impacts }
      }
    };
  }

  if (search.trim()) {
    const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ url: re }, { title: re }];
  }

  const sortDir = sortOrder === "desc" ? -1 : 1;
  const sortField =
    sortBy === "issues"
      ? "failedCount"
      : sortBy === "score"
      ? "score"
      : "url";

  const total = await AccessibilityReport.countDocuments(query);
  const docs = await AccessibilityReport.find(query)
    .sort({ [sortField]: sortDir })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    statusCode: 200,
    success: true,
    data: {
      pages: docs.map(d => ({
        id: d._id.toString(),
        url: d.url,
        title: d.title,
        score: d.score,
        passedCount: d.passedCount,
        failedCount: d.failedCount || (d.issues ? d.issues.length : 0),
        warningCount: d.warningCount,
        scanDate: d.scanDate,
      })),
      pagination: buildPagination(page, limit, total),
      jobId,
    },
  };
}

async function get_accessibility_page_detail_service({ tenantConnection, domainId, pageUrl }) {
  const { Domain, AccessibilityReport, AccessibilitySummary } = getModels(tenantConnection);
  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  const url = String(pageUrl || "").trim();
  if (!url) {
    return { statusCode: 400, success: false, message: "pageUrl is required" };
  }

  const host = getHostFromUrl(domainDoc.dm_url);
  const jobId = await getLatestJobId(AccessibilitySummary, host);

  let report = null;
  if (jobId) {
    const urlNorm = url.replace(/\/$/, "").toLowerCase();
    const candidates = await AccessibilityReport.find({ domain: host, jobId }).lean();
    report =
      candidates.find((r) => r.url.replace(/\/$/, "").toLowerCase() === urlNorm) ||
      candidates.find((r) => r.url.replace(/\/$/, "").toLowerCase().endsWith(urlNorm)) ||
      null;
  }

  if (!report) {
    return {
      statusCode: 200,
      success: true,
      data: null,
      message: "No scan data for this page yet.",
    };
  }

  return {
    statusCode: 200,
    success: true,
    data: report,
  };
}

async function trigger_accessibility_scan_service({ tenantConnection, domainId }) {
  const { Domain } = getModels(tenantConnection);
  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  if (domainDoc.dm_accessibility_status === "scanning") {
    return {
      statusCode: 200,
      success: true,
      message: "Accessibility scan is already in progress.",
      data: { status: "scanning" },
    };
  }

  await Domain.findByIdAndUpdate(domainDoc._id, {
    dm_accessibility_status: "scanning",
    dm_updated_at: new Date(),
  });

  const MASTER_URL = process.env.MASTER_MS_URL || "http://localhost:4100";
  try {
    const response = await fetch(`${MASTER_URL}/scan/accessibility`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dm_url: domainDoc.dm_url,
        dm_max_scanned_pages: domainDoc.dm_max_scanned_pages || 500,
        dm_scan_subdomains: domainDoc.dm_scan_subdomains ?? true,
        dm_render_pages_execute_js: domainDoc.dm_render_pages_execute_js ?? false,
        sourceDb: tenantConnection.name,
        sourceUri: process.env.DB_URL,
        sourceDomainDocId: domainDoc._id,
      }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      await Domain.findByIdAndUpdate(domainDoc._id, {
        dm_accessibility_status: "failed",
        dm_updated_at: new Date(),
      });
      return {
        statusCode: response.status,
        success: false,
        message: body.error || body.message || "Failed to enqueue Accessibility scan",
      };
    }

    return {
      statusCode: 200,
      success: true,
      message: "Accessibility scan started. Results will appear when the scan finishes.",
      data: {
        status: "scanning",
        jobId: body.jobId,
      },
    };
  } catch (err) {
    await Domain.findByIdAndUpdate(domainDoc._id, {
      dm_accessibility_status: "failed",
      dm_updated_at: new Date(),
    });
    console.error("Failed to trigger Accessibility scan in Master MS:", err);
    return {
      statusCode: 500,
      success: false,
      message: "Could not reach scan service. Please try again.",
    };
  }
}

async function get_accessibility_scan_status_service({ tenantConnection, domainId }) {
  const { Domain } = getModels(tenantConnection);
  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  return {
    statusCode: 200,
    success: true,
    data: {
      status: domainDoc.dm_accessibility_status || "pending",
      lastScanAt: domainDoc.dm_accessibility_last_scan_at || null,
    },
  };
}

module.exports = {
  get_accessibility_summary_service,
  get_accessibility_pages_service,
  get_accessibility_page_detail_service,
  trigger_accessibility_scan_service,
  get_accessibility_scan_status_service,
};
