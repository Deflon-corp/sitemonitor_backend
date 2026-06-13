const mongoose = require("mongoose");

function getModels(connection) {
  const { domainSchema } = require("../../domain/models/domain.schema");
  const { qaReportSchema } = require("../models/qaReport.schema");
  const { qaSummarySchema } = require("../models/qaSummary.schema");

  return {
    Domain:
      connection.models.Domain || connection.model("Domain", domainSchema, "domains"),
    QaReport:
      connection.models.QaReport || connection.model("QaReport", qaReportSchema, "qa_reports"),
    QaSummary:
      connection.models.QaSummary || connection.model("QaSummary", qaSummarySchema, "qa_summaries"),
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

async function getLatestQaJobId(QaSummary, host) {
  const summary = await QaSummary.findOne({ domain: host }).sort({ scanDate: -1 }).lean();
  return summary?.jobId || null;
}

function buildPagination(page, limit, total) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, pages };
}

/** True when page has QA issues used for compliance (ignores legacy broken-image false positives). */
function pageHasQaErrors(doc) {
  const hasBrokenLinks = (doc.brokenLinks || []).length > 0;
  const hasMisspellings = (doc.misspellings || []).length > 0;
  const hasPotential = (doc.potentialMisspellings || []).length > 0;
  const hasBrokenImages = (doc.brokenImages || []).some(
    (bi) => bi.statusCode != null && bi.statusCode >= 400
  );
  return hasBrokenLinks || hasMisspellings || hasPotential || hasBrokenImages;
}

function computeQaCompliancePercent(totalPages, pagesWithErrors) {
  if (!totalPages || totalPages <= 0) return 100;
  const compliant = Math.max(0, totalPages - pagesWithErrors);
  return Math.round((compliant / totalPages) * 10000) / 100;
}

async function refreshQaComplianceFromReports(QaReport, host, jobId, summary) {
  if (!jobId) return summary;

  const totalFromReports = await QaReport.countDocuments({ domain: host, jobId });
  const totalPages = totalFromReports > 0 ? totalFromReports : summary.totalPagesScanned || 0;

  if (totalPages <= 0) {
    return {
      ...summary,
      qaCompliancePercent: summary.qaCompliancePercent ?? 100,
      pagesWithQaErrors: summary.pagesWithQaErrors ?? 0,
      contentWithQaErrors: summary.contentWithQaErrors ?? 0,
    };
  }

  const docs = await QaReport.find({ domain: host, jobId })
    .select("brokenLinks brokenImages misspellings potentialMisspellings")
    .lean();

  let pagesWithQaErrors = 0;
  for (const doc of docs) {
    if (pageHasQaErrors(doc)) pagesWithQaErrors++;
  }

  const qaCompliancePercent = computeQaCompliancePercent(totalPages, pagesWithQaErrors);

  return {
    ...summary,
    totalPagesScanned: totalPages,
    pagesWithQaErrors,
    contentWithQaErrors: pagesWithQaErrors,
    qaCompliancePercent,
  };
}

function mapContentRow(doc, issueType) {
  const brokenLinksCount = (doc.brokenLinks || []).length;
  const brokenImagesCount = (doc.brokenImages || []).length;
  const misspellingsCount = (doc.misspellings || []).length;
  const potentialCount = (doc.potentialMisspellings || []).length;

  let notifications = doc.issueCount || 0;
  if (issueType === "broken-links") notifications = brokenLinksCount;
  if (issueType === "broken-images") notifications = brokenImagesCount;
  if (issueType === "misspellings") notifications = misspellingsCount;
  if (issueType === "potential-misspellings") notifications = potentialCount;

  let priority = "Low";
  if (notifications >= 10) priority = "High";
  else if (notifications >= 3) priority = "Medium";

  return {
    id: doc._id?.toString() || doc.url,
    title: doc.title || doc.url,
    url: doc.url,
    notifications,
    priority,
    views: 0,
    brokenLinksCount,
    brokenImagesCount,
    misspellingsCount,
    potentialMisspellingsCount: potentialCount,
    readabilityLevel: doc.readabilityLevel,
    readabilityScore: doc.readabilityScore,
    lastCrawled: doc.scanDate,
    misspellings: misspellingsCount,
    potentialMisspellings: potentialCount,
    language: "English",
  };
}

function normalizePageUrl(u) {
  return String(u || "")
    .trim()
    .replace(/\/$/, "")
    .toLowerCase();
}

function mapBrokenLinksForPage(brokenLinks = []) {
  return brokenLinks.map((bl, idx) => ({
    id: idx + 1,
    url: bl.href || bl.url || "",
    responseCode: String(bl.statusCode ?? bl.responseCode ?? 404),
    type: bl.type === "internal" ? "Internal" : bl.type === "external" ? "External" : bl.type || "Broken",
    dateFound: bl.dateFound || null,
    anchorText: bl.anchorText || "",
    inSitemap: !!bl.inSitemap,
  }));
}

function mapMisspellingsForPage(list = []) {
  return list.map((m, idx) => ({
    id: idx + 1,
    word: m.word || "",
    suggestions: m.suggestions || [],
    contextSnippet: m.contextSnippet || "",
    language: m.language || "English",
  }));
}

function buildPageDetailPayload(qaDoc, domainDoc, policyReports = [], defaultUrl = "") {
  const brokenLinks = mapBrokenLinksForPage(qaDoc?.brokenLinks || []);
  const brokenImages = (qaDoc?.brokenImages || []).map((bi, idx) => ({
    id: idx + 1,
    src: bi.src || bi.url || "",
    altText: bi.altText || bi.alt || "",
    statusCode: bi.statusCode,
  }));
  const misspellings = mapMisspellingsForPage(qaDoc?.misspellings || []);
  const potentialMisspellings = mapMisspellingsForPage(qaDoc?.potentialMisspellings || []);

  const seoImprovements = domainDoc?.seoImprovements || [];
  const seoScore = Math.round(
    domainDoc?.seoScore ?? domainDoc?.lighthouseSeoScore ?? 0
  );
  const accessibilityScore = Math.round(
    domainDoc?.lighthouseAccessibilityScore ??
      domainDoc?.accessibility?.score ??
      0
  );
  const performanceScore = Math.round(
    domainDoc?.lighthousePerformanceScore ??
      domainDoc?.performance?.score ??
      domainDoc?.performance?.advancedMetrics?.performanceScore ??
      0
  );

  const qaIssueCount =
    brokenLinks.length +
    brokenImages.filter((bi) => bi.statusCode == null || bi.statusCode >= 400).length +
    misspellings.length +
    potentialMisspellings.length;

  const qaHasErrors = pageHasQaErrors({
    brokenLinks: qaDoc?.brokenLinks,
    brokenImages: qaDoc?.brokenImages,
    misspellings: qaDoc?.misspellings,
    potentialMisspellings: qaDoc?.potentialMisspellings,
  });
  const qaCompliancePercent = qaHasErrors ? 0 : 100;

  const policyHits = policyReports.filter((p) => p.isHit);
  const policyCompliancePercent =
    policyReports.length > 0
      ? Math.round(((policyReports.length - policyHits.length) / policyReports.length) * 10000) /
        100
      : 100;

  const policiesByCategory = { unwanted: 0, required: 0, matches: 0 };
  policyHits.forEach((p) => {
    const cat = String(p.category || "").toLowerCase();
    if (cat === "unwanted") policiesByCategory.unwanted += 1;
    else if (cat === "required") policiesByCategory.required += 1;
    else policiesByCategory.matches += 1;
  });

  const seoByPriority = { high: 0, medium: 0, low: 0 };
  seoImprovements.forEach((imp) => {
    const p = String(imp.priority || "low").toLowerCase();
    if (p === "high") seoByPriority.high += 1;
    else if (p === "medium") seoByPriority.medium += 1;
    else seoByPriority.low += 1;
  });

  const internalLinks = domainDoc?.links?.internalUrls?.length ?? domainDoc?.links?.internal ?? 0;
  const externalLinks = domainDoc?.links?.externalUrls?.length ?? domainDoc?.links?.external ?? 0;

  return {
    id: qaDoc?._id?.toString() || domainDoc?._id?.toString() || policyReports?.[0]?._id?.toString() || "",
    title: qaDoc?.title || domainDoc?.meta?.title || qaDoc?.url || domainDoc?.url || defaultUrl || "",
    url: qaDoc?.url || domainDoc?.url || defaultUrl || "",
    httpStatus: qaDoc?.httpStatus ?? domainDoc?.httpStatus ?? 200,
    scanDate: qaDoc?.scanDate || domainDoc?.scanDate || null,
    readabilityScore: qaDoc?.readabilityScore ?? domainDoc?.textMetrics?.readabilityScore ?? 0,
    readabilityLevel: qaDoc?.readabilityLevel || "",
    brokenLinks,
    brokenImages,
    misspellings,
    potentialMisspellings,
    seoImprovements,
    seoScore,
    seoOpportunitiesCount: seoImprovements.length,
    seoByPriority,
    lighthouseAccessibilityScore: accessibilityScore,
    lighthousePerformanceScore: performanceScore,
    lighthouseSeoScore: seoScore,
    accessibility: domainDoc?.accessibility || null,
    performance: domainDoc?.performance || null,
    networkMetrics: domainDoc?.networkMetrics || null,
    imageAnalysis: domainDoc?.imageAnalysis || null,
    images: domainDoc?.images || domainDoc?.imageAnalysis || null,
    links: {
      internal: internalLinks,
      external: externalLinks,
      internalUrls: domainDoc?.links?.internalUrls || [],
      externalUrls: domainDoc?.links?.externalUrls || [],
    },
    files: domainDoc?.files || { others: [] },
    meta: domainDoc?.meta || {},
    headings: domainDoc?.headings || {},
    textMetrics: domainDoc?.textMetrics || {},
    resources: domainDoc?.resources || [],
    cssAnalysis: domainDoc?.cssAnalysis || {},
    jsAnalysis: domainDoc?.jsAnalysis || {},
    additionalChecks: domainDoc?.additionalChecks || {},
    policies: policyReports.map((pr) => ({
      id: pr.policyId?._id?.toString() || pr.policyId?.toString() || pr._id?.toString(),
      name: pr.policyId?.title || pr.policyName || pr.matchedRules?.[0]?.ruleName || "Policy",
      category: pr.category || "matches",
      priority: pr.priority || "Medium",
      isHit: !!pr.isHit,
      matchCount: pr.matchCount || 0,
      note: pr.policyId?.description || pr.note || "—",
      matchedRules: pr.matchedRules || [],
    })),
    policyCompliancePercent,
    policyViolationsCount: policyHits.length,
    policiesByCategory,
    qaIssueCount,
    qaCompliancePercent,
    qaBrokenLinksCount: brokenLinks.length,
    qaBrokenImagesCount: brokenImages.length,
    qaMisspellingsCount: misspellings.length,
    qaPotentialMisspellingsCount: potentialMisspellings.length,
  };
}

/**
 * GET full page detail for page drawer (QA + SEO + policies + inventory metrics).
 */
async function get_qa_page_detail_service({ tenantConnection, domainId, pageUrl }) {
  const { domainReportSchema } = require("../../domain/models/domainReport.schema");
  const { policyReportSchema } = require("../../policy/models/policyReport.schema");

  const { Domain, QaReport, QaSummary } = getModels(tenantConnection);
  const DomainReport =
    tenantConnection.models.DomainReport ||
    tenantConnection.model("DomainReport", domainReportSchema, "domain_reports");
  const PolicyReport =
    tenantConnection.models.PolicyReport ||
    tenantConnection.model("PolicyReport", policyReportSchema, "policy_reports");

  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  const url = String(pageUrl || "").trim();
  if (!url) {
    return { statusCode: 400, success: false, message: "pageUrl query parameter is required" };
  }

  const host = getHostFromUrl(domainDoc.dm_url);
  const jobId = await getLatestQaJobId(QaSummary, host);
  const urlNorm = normalizePageUrl(url);

  let qaDoc = null;
  if (jobId) {
    const qaCandidates = await QaReport.find({ domain: host, jobId }).lean();
    qaDoc =
      qaCandidates.find((r) => normalizePageUrl(r.url) === urlNorm) ||
      qaCandidates.find((r) => normalizePageUrl(r.url).endsWith(urlNorm) || urlNorm.endsWith(normalizePageUrl(r.url))) ||
      null;
  }

  const domainCandidates = await DomainReport.find({ domain: host })
    .sort({ scanDate: -1 })
    .limit(500)
    .lean();
  const domainPageDoc =
    domainCandidates.find((r) => normalizePageUrl(r.url) === urlNorm) ||
    domainCandidates.find(
      (r) =>
        normalizePageUrl(r.url).endsWith(urlNorm) || urlNorm.endsWith(normalizePageUrl(r.url))
    ) ||
    null;

  const policyFilter = { domainId: domainDoc._id, url: { $regex: new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } };
  
  if (tenantConnection.models.Policy === undefined) {
      const { policySchema } = require("../../policy/models/policy.schema");
      tenantConnection.model("Policy", policySchema, "policies");
  }

  const allPolicies = await tenantConnection.model("Policy").find({ is_deleted: false }).lean();
  
  const rawPolicyReports = await PolicyReport.find(policyFilter)
    .populate({ path: "policyId", model: "Policy", select: "title description" })
    .lean();

  const enrichedPolicyReports = [...rawPolicyReports];
  const hitPolicyIds = new Set(rawPolicyReports.map(pr => pr.policyId?._id?.toString() || pr.policyId?.toString()));
  
  for (const p of allPolicies) {
    if (!hitPolicyIds.has(p._id.toString())) {
      enrichedPolicyReports.push({
        _id: p._id,
        policyId: { _id: p._id, title: p.title, description: p.description },
        domainName: host,
        url: url,
        isHit: false,
        matchCount: 0,
        totalCount: 0,
        category: p.category || "matches",
        priority: "Low",
      });
    }
  }

  const policyReports = enrichedPolicyReports;

  if (!qaDoc && !domainPageDoc && policyReports.length === 0) {
    return {
      statusCode: 200,
      success: true,
      data: {
        id: "",
        title: url,
        url,
        brokenLinks: [],
        brokenImages: [],
        misspellings: [],
        potentialMisspellings: [],
        seoImprovements: [],
        seoScore: 0,
        seoOpportunitiesCount: 0,
        seoByPriority: { high: 0, medium: 0, low: 0 },
        lighthouseAccessibilityScore: 0,
        lighthousePerformanceScore: 0,
        policies: [],
        policyCompliancePercent: 100,
        policyViolationsCount: 0,
        policiesByCategory: { unwanted: 0, required: 0, matches: 0 },
        qaIssueCount: 0,
        qaCompliancePercent: 100,
        qaBrokenLinksCount: 0,
        qaBrokenImagesCount: 0,
        qaMisspellingsCount: 0,
        qaPotentialMisspellingsCount: 0,
      },
      message: "No scan data for this page yet. Run a QA scan.",
    };
  }

  return {
    statusCode: 200,
    success: true,
    data: buildPageDetailPayload(qaDoc, domainPageDoc, policyReports, url),
  };
}

/**
 * GET QA summary for domain dashboard
 */
async function get_qa_summary_service({ tenantConnection, domainId }) {
  const { Domain, QaSummary } = getModels(tenantConnection);
  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  const host = getHostFromUrl(domainDoc.dm_url);
  const summary = await QaSummary.findOne({ domain: host }).sort({ scanDate: -1 }).lean();

  if (!summary) {
    return {
      statusCode: 200,
      success: true,
      data: null,
      message: "No QA scan data available. Run a domain scan first.",
    };
  }

  const { QaReport } = getModels(tenantConnection);
  const enriched = await refreshQaComplianceFromReports(
    QaReport,
    host,
    summary.jobId,
    summary
  );

  return {
    statusCode: 200,
    success: true,
    data: {
      ...enriched,
      domainHost: summary.domain || host,
      domainDoc,
      ignoredSpellings: domainDoc.dm_ignored_spellings || [],
    },
  };
}

/**
 * GET paginated QA pages with filters
 */
async function get_qa_pages_service({
  tenantConnection,
  domainId,
  page = 1,
  limit = 10,
  search = "",
  sortBy = "url",
  sortOrder = "asc",
  filter = "all",
}) {
  const { Domain, QaReport, QaSummary } = getModels(tenantConnection);
  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  const host = getHostFromUrl(domainDoc.dm_url);
  const jobId = await getLatestQaJobId(QaSummary, host);
  if (!jobId) {
    return {
      statusCode: 200,
      success: true,
      data: { pages: [], pagination: buildPagination(page, limit, 0) },
      message: "No QA scan data",
    };
  }

  const query = { domain: host, jobId };
  const filterParts = [];

  if (filter === "qa-errors" || filter === "all-errors") {
    filterParts.push({ hasQaErrors: true });
  } else if (filter === "broken-links") {
    filterParts.push({ "brokenLinks.0": { $exists: true } });
  } else if (filter === "broken-images") {
    filterParts.push({ "brokenImages.0": { $exists: true } });
  } else if (filter === "misspellings") {
    filterParts.push({ "misspellings.0": { $exists: true } });
  } else if (filter === "potential-misspellings") {
    filterParts.push({ "potentialMisspellings.0": { $exists: true } });
  } else if (filter === "spellcheck-pages") {
    filterParts.push({
      $or: [
        { "misspellings.0": { $exists: true } },
        { "potentialMisspellings.0": { $exists: true } },
      ],
    });
  }

  if (search.trim()) {
    const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filterParts.push({ $or: [{ url: re }, { title: re }] });
  }

  if (filterParts.length === 1) {
    Object.assign(query, filterParts[0]);
  } else if (filterParts.length > 1) {
    query.$and = filterParts;
  }

  const sortDir = sortOrder === "desc" ? -1 : 1;
  const sortField =
    sortBy === "issues"
      ? "issueCount"
      : sortBy === "title"
        ? "title"
        : sortBy === "readability"
          ? "readabilityScore"
          : "url";

  const total = await QaReport.countDocuments(query);
  const docs = await QaReport.find(query)
    .sort({ [sortField]: sortDir })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const issueType =
    filter === "broken-links"
      ? "broken-links"
      : filter === "broken-images"
        ? "broken-images"
        : filter === "misspellings"
          ? "misspellings"
          : filter === "potential-misspellings"
            ? "potential-misspellings"
            : "all";

  return {
    statusCode: 200,
    success: true,
    data: {
      pages: docs.map((d) => mapContentRow(d, issueType)),
      pagination: buildPagination(page, limit, total),
      jobId,
    },
  };
}

/**
 * Aggregate broken links across all pages for a scan
 */
function aggregateBrokenLinks(reports, { tab = "all", search = "" } = {}) {
  const map = new Map();
  let idCounter = 1;

  for (const report of reports) {
    for (const bl of report.brokenLinks || []) {
      if (tab === "ignored" && !bl.isIgnored) continue;
      if (tab === "fixed" && !bl.isFixed) continue;
      if (tab === "all" && (bl.isIgnored || bl.isFixed)) continue;

      const key = bl.href;
      if (!map.has(key)) {
        map.set(key, {
          id: idCounter++,
          url: bl.href,
          responseCode: String(bl.statusCode || 404),
          type: bl.type === "external" ? "link" : "link",
          linkType: bl.type || "internal",
          documentsCount: 0,
          pagesCount: 0,
          pages: [],
          isFixed: !!bl.isFixed,
          isIgnored: !!bl.isIgnored,
          inSitemap: bl.inSitemap === true || bl.inSitemap === undefined,
        });
      }
      const entry = map.get(key);
      entry.pagesCount += 1;
      entry.pages.push({ url: report.url, title: report.title || report.url });
      if (bl.isFixed) entry.isFixed = true;
      if (bl.isIgnored) entry.isIgnored = true;
      if (bl.inSitemap === true || bl.inSitemap === undefined) entry.inSitemap = true;
    }
  }

  let rows = [...map.values()];
  if (search.trim()) {
    const q = search.toLowerCase();
    rows = rows.filter((r) => r.url.toLowerCase().includes(q));
  }
  return rows;
}

async function get_qa_broken_links_service({
  tenantConnection,
  domainId,
  page = 1,
  limit = 10,
  search = "",
  sortBy = "url",
  sortOrder = "asc",
  tab = "all",
}) {
  const { Domain, QaReport, QaSummary } = getModels(tenantConnection);
  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  const host = getHostFromUrl(domainDoc.dm_url);
  const jobId = await getLatestQaJobId(QaSummary, host);
  if (!jobId) {
    return {
      statusCode: 200,
      success: true,
      data: { links: [], pagination: buildPagination(page, limit, 0), statusCodes: {} },
    };
  }

  const reports = await QaReport.find({ domain: host, jobId }).lean();
  let rows = aggregateBrokenLinks(reports, { tab, search });

  if (sortBy === "url") {
    rows.sort((a, b) =>
      sortOrder === "desc" ? b.url.localeCompare(a.url) : a.url.localeCompare(b.url)
    );
  } else if (sortBy === "pages") {
    rows.sort((a, b) =>
      sortOrder === "desc" ? b.pagesCount - a.pagesCount : a.pagesCount - b.pagesCount
    );
  }

  const total = rows.length;
  const paginated = rows.slice((page - 1) * limit, page * limit);

  const summary = await QaSummary.findOne({ domain: host, jobId }).lean();
  const statusCodes = summary?.brokenLinkStatusCodes || {};

  return {
    statusCode: 200,
    success: true,
    data: {
      links: paginated,
      pagination: buildPagination(page, limit, total),
      statusCodes,
      jobId,
      totals: {
        unique: summary?.uniqueBrokenLinks || total,
        internal: summary?.internalBrokenLinks || 0,
        external: summary?.externalBrokenLinks || 0,
      },
    },
  };
}

async function get_qa_broken_links_sitemap_service({
  tenantConnection,
  domainId,
  page = 1,
  limit = 10,
  search = "",
  tab = "all",
}) {
  const { Domain, QaReport, QaSummary } = getModels(tenantConnection);
  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  const host = getHostFromUrl(domainDoc.dm_url);
  const jobId = await getLatestQaJobId(QaSummary, host);
  if (!jobId) {
    return {
      statusCode: 200,
      success: true,
      data: { links: [], pagination: buildPagination(page, limit, 0), jobId: null },
    };
  }

  const reports = await QaReport.find({ domain: host, jobId }).lean();
  let rows = aggregateBrokenLinks(reports, { tab: "all", search }).filter((l) => l.inSitemap);
  if (tab === "ignored") rows = rows.filter((l) => l.isIgnored);
  else if (tab === "fixed") rows = rows.filter((l) => l.isFixed);
  else rows = rows.filter((l) => !l.isIgnored && !l.isFixed);

  const summary = await QaSummary.findOne({ domain: host, jobId }).lean();
  const total = rows.length;
  return {
    statusCode: 200,
    success: true,
    data: {
      links: rows.slice((page - 1) * limit, page * limit),
      pagination: buildPagination(page, limit, total),
      jobId,
      sitemapCount: summary?.brokenLinksInSitemap ?? total,
    },
  };
}

function aggregateBrokenImages(reports, { tab = "all", search = "" } = {}) {
  const map = new Map();
  let idCounter = 1;

  for (const report of reports) {
    for (const bi of report.brokenImages || []) {
      if (tab === "ignored" && !bi.isIgnored) continue;
      if (tab === "fixed" && !bi.isFixed) continue;
      if (tab === "all" && (bi.isIgnored || bi.isFixed)) continue;

      const key = bi.src;
      if (!map.has(key)) {
        map.set(key, {
          id: idCounter++,
          url: bi.src,
          responseCode: "404",
          type: "image",
          documentsCount: 0,
          pagesCount: 0,
          pages: [],
          isFixed: !!bi.isFixed,
          isIgnored: !!bi.isIgnored,
        });
      }
      const entry = map.get(key);
      entry.pagesCount += 1;
      entry.pages.push({ url: report.url, title: report.title || report.url });
    }
  }

  let rows = [...map.values()];
  if (search.trim()) {
    const q = search.toLowerCase();
    rows = rows.filter((r) => r.url.toLowerCase().includes(q));
  }
  return rows;
}

async function get_qa_broken_images_service({
  tenantConnection,
  domainId,
  page = 1,
  limit = 10,
  search = "",
  sortBy = "url",
  sortOrder = "asc",
  tab = "all",
}) {
  const { Domain, QaReport, QaSummary } = getModels(tenantConnection);
  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  const host = getHostFromUrl(domainDoc.dm_url);
  const jobId = await getLatestQaJobId(QaSummary, host);
  if (!jobId) {
    return {
      statusCode: 200,
      success: true,
      data: { images: [], pagination: buildPagination(page, limit, 0) },
    };
  }

  const reports = await QaReport.find({ domain: host, jobId }).lean();
  let rows = aggregateBrokenImages(reports, { tab, search });

  if (sortBy === "pages") {
    rows.sort((a, b) =>
      sortOrder === "desc" ? b.pagesCount - a.pagesCount : a.pagesCount - b.pagesCount
    );
  } else {
    rows.sort((a, b) =>
      sortOrder === "desc" ? b.url.localeCompare(a.url) : a.url.localeCompare(b.url)
    );
  }

  const total = rows.length;
  return {
    statusCode: 200,
    success: true,
    data: {
      images: rows.slice((page - 1) * limit, page * limit),
      pagination: buildPagination(page, limit, total),
      jobId,
    },
  };
}

function aggregateMisspellings(reports, { potential = false, search = "" } = {}) {
  const map = new Map();
  let idCounter = 1;

  for (const report of reports) {
    const list = potential ? report.potentialMisspellings || [] : report.misspellings || [];
    for (const m of list) {
      const word = String(m.word || "").trim();
      const key = word.toLowerCase();
      if (!word || key.length < 2 || key.length > 64) continue;
      if (!map.has(key)) {
        map.set(key, {
          id: String(idCounter++),
          word,
          language: "English",
          dateFound: report.scanDate,
          pages: [],
          pagesCount: 0,
          suggestions: m.suggestions || [],
        });
      }
      const entry = map.get(key);
      if (!entry._pageUrls) entry._pageUrls = new Set();
      if (entry._pageUrls.has(report.url)) continue;
      entry._pageUrls.add(report.url);
      entry.pagesCount += 1;
      entry.pages.push({
        url: report.url,
        title: report.title || report.url,
        language: "English",
        misspellings: (report.misspellings || []).length,
        potentialMisspellings: (report.potentialMisspellings || []).length,
        views: 0,
      });
    }
  }

  for (const row of map.values()) {
    delete row._pageUrls;
  }

  let rows = [...map.values()];
  if (search.trim()) {
    const q = search.toLowerCase();
    rows = rows.filter((r) => r.word.toLowerCase().includes(q));
  }
  rows.sort((a, b) => b.pagesCount - a.pagesCount);
  return rows;
}

async function get_qa_misspellings_service({
  tenantConnection,
  domainId,
  page = 1,
  limit = 10,
  search = "",
  potential = false,
}) {
  const { Domain, QaReport, QaSummary } = getModels(tenantConnection);
  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  const host = getHostFromUrl(domainDoc.dm_url);
  const jobId = await getLatestQaJobId(QaSummary, host);
  if (!jobId) {
    return {
      statusCode: 200,
      success: true,
      data: { items: [], pagination: buildPagination(page, limit, 0) },
    };
  }

  const reports = await QaReport.find({ domain: host, jobId }).lean();
  const rows = aggregateMisspellings(reports, { potential, search });
  const total = rows.length;

  return {
    statusCode: 200,
    success: true,
    data: {
      items: rows.slice((page - 1) * limit, page * limit),
      pagination: buildPagination(page, limit, total),
      jobId,
    },
  };
}

async function get_qa_spellcheck_summary_service({ tenantConnection, domainId }) {
  const summaryResult = await get_qa_summary_service({ tenantConnection, domainId });
  if (!summaryResult.success) return summaryResult;
  if (!summaryResult.data) {
    return {
      statusCode: 200,
      success: true,
      data: {
        uniqueMisspellings: 0,
        uniquePotentialMisspellings: 0,
        potentialMisspellings: 0,
        pagesWithMisspellings: 0,
        pagesWithPotentialMisspellings: 0,
        mostCommonMisspellings: [],
        mostCommonPotential: [],
        jobId: null,
      },
      message: summaryResult.message,
    };
  }

  const s = summaryResult.data;
  const domainHost =
    typeof s.domain === "string"
      ? s.domain
      : s.domainHost || getHostFromUrl(s.domainDoc?.dm_url);
  let uniqueMisspellings = s.uniqueMisspellings;
  let uniquePotentialMisspellings = s.uniquePotentialMisspellings;

  if (
    (uniqueMisspellings == null || uniquePotentialMisspellings == null) &&
    s.jobId &&
    domainHost
  ) {
    const { QaReport } = getModels(tenantConnection);
    const reports = await QaReport.find({ domain: domainHost, jobId: s.jobId }).lean();
    if (uniqueMisspellings == null) {
      uniqueMisspellings = aggregateMisspellings(reports, { potential: false }).length;
    }
    if (uniquePotentialMisspellings == null) {
      uniquePotentialMisspellings = aggregateMisspellings(reports, { potential: true }).length;
    }
  }

  return {
    statusCode: 200,
    success: true,
    data: {
      uniqueMisspellings: uniqueMisspellings ?? s.topMisspellings?.length ?? 0,
      totalMisspellingInstances: s.totalMisspellings || 0,
      uniquePotentialMisspellings:
        uniquePotentialMisspellings ?? s.topPotentialMisspellings?.length ?? 0,
      potentialMisspellings:
        uniquePotentialMisspellings ?? s.topPotentialMisspellings?.length ?? 0,
      totalPotentialInstances: s.totalPotentialMisspellings || 0,
      pagesWithMisspellings: s.pagesWithMisspellings || 0,
      pagesWithPotentialMisspellings: s.pagesWithPotentialMisspellings || 0,
      mostCommonMisspellings: s.topMisspellings || [],
      mostCommonPotential: s.topPotentialMisspellings || [],
      misspellingAffectingMostContent: s.misspellingAffectingMostContent,
      jobId: s.jobId,
    },
  };
}

async function get_qa_readability_service({ tenantConnection, domainId }) {
  const { Domain, QaReport, QaSummary } = getModels(tenantConnection);
  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  const host = getHostFromUrl(domainDoc.dm_url);
  const jobId = await getLatestQaJobId(QaSummary, host);
  if (!jobId) {
    return { statusCode: 200, success: true, data: null, message: "No QA scan data" };
  }

  const summary = await QaSummary.findOne({ domain: host, jobId }).lean();
  const distribution = summary?.readabilityDistribution || {};
  const buckets = Object.entries(distribution).map(([level, count]) => ({
    level,
    count,
    percent: summary.totalPagesScanned
      ? Math.round((count / summary.totalPagesScanned) * 1000) / 10
      : 0,
  }));

  return {
    statusCode: 200,
    success: true,
    data: {
      mostCommonLevel: summary.mostCommonReadabilityLevel,
      pagesAtMostCommon: summary.readabilityPagesCount || 0,
      distribution: buckets,
      totalPages: summary.totalPagesScanned || 0,
      jobId,
    },
  };
}

async function get_qa_readability_pages_service({
  tenantConnection,
  domainId,
  level,
  page = 1,
  limit = 10,
  search = "",
}) {
  const { Domain, QaReport, QaSummary } = getModels(tenantConnection);
  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  const host = getHostFromUrl(domainDoc.dm_url);
  const jobId = await getLatestQaJobId(QaSummary, host);
  if (!jobId) {
    return {
      statusCode: 200,
      success: true,
      data: { pages: [], pagination: buildPagination(page, limit, 0) },
    };
  }

  const query = { domain: host, jobId };
  if (level) query.readabilityLevel = level;
  if (search.trim()) {
    const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ url: re }, { title: re }];
  }

  const total = await QaReport.countDocuments(query);
  const docs = await QaReport.find(query)
    .sort({ url: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    statusCode: 200,
    success: true,
    data: {
      pages: docs.map((d) => ({
        id: d._id?.toString(),
        title: d.title || d.url,
        url: d.url,
        readabilityLevel: d.readabilityLevel,
        readabilityScore: d.readabilityScore,
      })),
      pagination: buildPagination(page, limit, total),
      jobId,
    },
  };
}

async function get_qa_broken_link_pages_service({ tenantConnection, domainId, href }) {
  const { Domain, QaReport, QaSummary } = getModels(tenantConnection);
  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  const host = getHostFromUrl(domainDoc.dm_url);
  const jobId = await getLatestQaJobId(QaSummary, host);
  if (!jobId) {
    return { statusCode: 200, success: true, data: { pages: [] } };
  }

  const reports = await QaReport.find({
    domain: host,
    jobId,
    "brokenLinks.href": href,
  }).lean();

  const pages = reports.map((r) => ({
    id: r._id?.toString(),
    title: r.title || r.url,
    url: r.url,
    notifications: (r.brokenLinks || []).filter((bl) => bl.href === href).length,
    priority: "Medium",
    views: 0,
  }));

  return { statusCode: 200, success: true, data: { pages, href } };
}

async function patch_qa_link_status_service({
  tenantConnection,
  domainId,
  href,
  isFixed,
  isIgnored,
  type = "link",
}) {
  const { Domain, QaReport, QaSummary } = getModels(tenantConnection);
  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  const host = getHostFromUrl(domainDoc.dm_url);
  const jobId = await getLatestQaJobId(QaSummary, host);
  if (!jobId) {
    return { statusCode: 400, success: false, message: "No QA scan data" };
  }

  const field = type === "image" ? "brokenImages" : "brokenLinks";

  const update = {};
  if (isFixed != null) update[`${field}.$[elem].isFixed`] = !!isFixed;
  if (isIgnored != null) update[`${field}.$[elem].isIgnored`] = !!isIgnored;

  if (type === "image") {
    await QaReport.updateMany(
      { domain: host, jobId, "brokenImages.src": href },
      { $set: update },
      { arrayFilters: [{ "elem.src": href }] }
    );
  } else {
    await QaReport.updateMany(
      { domain: host, jobId, "brokenLinks.href": href },
      { $set: update },
      { arrayFilters: [{ "elem.href": href }] }
    );
  }

  return { statusCode: 200, success: true, message: "Updated" };
}

/**
 * Enqueue a QA-only scan in Master MS (crawl + qa_reports / qa_summaries).
 */
async function trigger_qa_scan_service({ tenantConnection, domainId }) {
  const { Domain } = getModels(tenantConnection);
  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  if (domainDoc.dm_qa_status === "scanning") {
    return {
      statusCode: 200,
      success: true,
      message: "QA scan is already in progress.",
      data: { status: "scanning" },
    };
  }

  await Domain.findByIdAndUpdate(domainDoc._id, {
    dm_qa_status: "scanning",
    dm_updated_at: new Date(),
  });

  const MASTER_URL = process.env.MASTER_MS_URL || "http://localhost:4100";
  try {
    const response = await fetch(`${MASTER_URL}/scan/qa`, {
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
        dm_qa_status: "failed",
        dm_updated_at: new Date(),
      });
      return {
        statusCode: response.status,
        success: false,
        message: body.error || body.message || "Failed to enqueue QA scan",
      };
    }

    return {
      statusCode: 200,
      success: true,
      message: "QA scan started. Results will appear when the crawl finishes.",
      data: {
        status: "scanning",
        jobId: body.jobId,
      },
    };
  } catch (err) {
    await Domain.findByIdAndUpdate(domainDoc._id, {
      dm_qa_status: "failed",
      dm_updated_at: new Date(),
    });
    console.error("Failed to trigger QA scan in Master MS:", err);
    return {
      statusCode: 500,
      success: false,
      message: "Could not reach scan service. Please try again.",
    };
  }
}

/**
 * Poll-friendly QA scan status from domain record.
 */
async function get_qa_scan_status_service({ tenantConnection, domainId }) {
  const { Domain } = getModels(tenantConnection);
  const domainDoc = await resolveDomain(Domain, domainId);
  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  return {
    statusCode: 200,
    success: true,
    data: {
      status: domainDoc.dm_qa_status || "pending",
      lastScanAt: domainDoc.dm_qa_last_scan_at || null,
    },
  };
}

module.exports = {
  get_qa_page_detail_service,
  get_qa_summary_service,
  get_qa_pages_service,
  get_qa_broken_links_service,
  get_qa_broken_links_sitemap_service,
  get_qa_broken_images_service,
  get_qa_misspellings_service,
  get_qa_spellcheck_summary_service,
  get_qa_readability_service,
  get_qa_readability_pages_service,
  get_qa_broken_link_pages_service,
  patch_qa_link_status_service,
  trigger_qa_scan_service,
  get_qa_scan_status_service,
};
