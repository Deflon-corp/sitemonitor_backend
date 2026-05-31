const mongoose = require("mongoose");

function getModels(connection) {
  const { domainSchema } = require("../../domain/models/domain.schema");
  const { domainSummarySchema } = require("../../domain/models/domainSummary.schema");
  const { domainReportSchema } = require("../../domain/models/domainReport.schema");

  return {
    Domain: connection.models.Domain || connection.model("Domain", domainSchema, "domains"),
    DomainSummary: connection.models.DomainSummary || connection.model("DomainSummary", domainSummarySchema, "domain_summaries"),
    DomainReport: connection.models.DomainReport || connection.model("DomainReport", domainReportSchema, "domain_reports"),
  };
}

function getHostFromUrl(url) {
  if (!url) return "";
  return url.toLowerCase().trim()
    .replace(/^https?[:/\\]+/i, "")
    .replace(/[/\\]+.*$/, "");
}

async function getLatestJobId(DomainSummary, DomainReport, host) {
  const summary = await DomainSummary.findOne({ domain: host }).sort({ lastScanDate: -1 }).lean();
  if (summary && summary.jobId) return summary.jobId;

  const latestReport = await DomainReport.findOne({ domain: host }).sort({ scanDate: -1 }).lean();
  return latestReport ? latestReport.jobId : null;
}

/**
 * Retrieves the performance summary for a domain
 */
async function getPerformanceSummary({ tenantConnection, domainId }) {
  const { Domain, DomainSummary, DomainReport } = getModels(tenantConnection);

  const domainDoc = await Domain.findOne({
    $or: [
      { _id: mongoose.Types.ObjectId.isValid(domainId) ? domainId : null },
      { dm_id: !isNaN(Number(domainId)) ? Number(domainId) : null }
    ],
    dm_is_deleted: false
  }).lean();

  if (!domainDoc) {
    return { success: false, statusCode: 404, message: "Domain not found" };
  }

  const host = getHostFromUrl(domainDoc.dm_url);
  const jobId = await getLatestJobId(DomainSummary, DomainReport, host);
  if (!jobId) {
    return { success: true, statusCode: 200, data: null, message: "No scans found" };
  }

  const reports = await DomainReport.find({ domain: host, jobId }).lean();

  let goodCount = 0;
  let needsImprovementCount = 0;
  let poorCount = 0;

  let totalScore = 0;
  let scoredPagesCount = 0;

  let totalLCP = 0;
  let lcpCount = 0;

  let totalINP = 0;
  let inpCount = 0;

  let totalCLS = 0;
  let clsCount = 0;

  let totalTTFB = 0;
  let ttfbCount = 0;

  let totalSpeedIndex = 0;
  let speedIndexCount = 0;

  for (const r of reports) {
    const score = r.lighthousePerformanceScore || r.performance?.advancedMetrics?.performanceScore || r.performance?.score || null;
    if (score !== null && score !== undefined) {
      totalScore += score;
      scoredPagesCount++;

      if (score >= 90) goodCount++;
      else if (score >= 50) needsImprovementCount++;
      else poorCount++;
    }

    const lcp = r.performance?.coreWebVitals?.LCP || r.performance?.lcp || r.performance?.largestContentfulPaint || null;
    if (lcp !== null && lcp !== undefined && lcp > 0) {
      totalLCP += lcp;
      lcpCount++;
    }

    const inp = r.performance?.coreWebVitals?.INP || r.performance?.inp || r.performance?.interactionToNextPaint || null;
    if (inp !== null && inp !== undefined && inp > 0) {
      totalINP += inp;
      inpCount++;
    }

    const cls = r.performance?.coreWebVitals?.CLS || r.performance?.cls || r.performance?.cumulativeLayoutShift || null;
    if (cls !== null && cls !== undefined && cls > 0) {
      totalCLS += cls;
      clsCount++;
    }

    const ttfb = r.performance?.timeToFirstByte || r.performance?.ttfb || null;
    if (ttfb !== null && ttfb !== undefined && ttfb > 0) {
      totalTTFB += ttfb;
      ttfbCount++;
    }

    const speedIndex = r.performance?.coreWebVitals?.SpeedIndex || r.performance?.speedIndex || r.performance?.speed_index || null;
    if (speedIndex !== null && speedIndex !== undefined && speedIndex > 0) {
      totalSpeedIndex += speedIndex;
      speedIndexCount++;
    }
  }

  const avgScore = scoredPagesCount > 0 ? Math.round(totalScore / scoredPagesCount) : 0;
  const avgLCP = lcpCount > 0 ? Number((totalLCP / lcpCount).toFixed(2)) : 0;
  const avgINP = inpCount > 0 ? Math.round(totalINP / inpCount) : 0;
  const avgCLS = clsCount > 0 ? Number((totalCLS / clsCount).toFixed(3)) : 0;
  const avgTTFB = ttfbCount > 0 ? Math.round(totalTTFB / ttfbCount) : 0;
  const avgSpeedIndex = speedIndexCount > 0 ? Math.round(totalSpeedIndex / speedIndexCount) : 0;

  return {
    success: true,
    statusCode: 200,
    data: {
      domain: domainDoc,
      avgScore,
      avgLCP,
      avgINP,
      avgCLS,
      avgTTFB,
      avgSpeedIndex,
      distribution: {
        good: goodCount,
        needsImprovement: needsImprovementCount,
        poor: poorCount
      },
      totalPages: reports.length,
      scoredPages: scoredPagesCount,
      jobId
    }
  };
}

/**
 * Retrieves paginated, searchable, sortable page-level speed metrics
 */
async function getPerformancePages({ tenantConnection, domainId, page = 1, limit = 10, search = "", sortBy = "score", sortOrder = "desc" }) {
  const { Domain, DomainSummary, DomainReport } = getModels(tenantConnection);

  const domainDoc = await Domain.findOne({
    $or: [
      { _id: mongoose.Types.ObjectId.isValid(domainId) ? domainId : null },
      { dm_id: !isNaN(Number(domainId)) ? Number(domainId) : null }
    ],
    dm_is_deleted: false
  }).lean();

  if (!domainDoc) {
    return { success: false, statusCode: 404, message: "Domain not found" };
  }

  const host = getHostFromUrl(domainDoc.dm_url);
  const jobId = await getLatestJobId(DomainSummary, DomainReport, host);
  if (!jobId) {
    return { success: true, statusCode: 200, data: { pages: [], total: 0, totalPages: 0 } };
  }

  const filter = { domain: host, jobId };

  if (search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [
      { url: regex },
      { "meta.title": regex }
    ];
  }

  const allReports = await DomainReport.find(filter).lean();

  const formattedPages = allReports.map(r => {
    const score = r.lighthousePerformanceScore || r.performance?.advancedMetrics?.performanceScore || r.performance?.score || 0;
    return {
      id: r._id,
      url: r.url,
      title: r.meta?.title || r.title || r.pageTitle || "Untitled Page",
      performanceScore: score,
      lcp: r.performance?.coreWebVitals?.LCP || r.performance?.lcp || r.performance?.largestContentfulPaint || 0,
      cls: r.performance?.coreWebVitals?.CLS || r.performance?.cls || r.performance?.cumulativeLayoutShift || 0,
      inp: r.performance?.coreWebVitals?.INP || r.performance?.inp || r.performance?.interactionToNextPaint || 0,
      ttfb: r.performance?.timeToFirstByte || r.performance?.ttfb || 0,
      speedIndex: r.performance?.coreWebVitals?.SpeedIndex || r.performance?.speedIndex || r.performance?.speed_index || 0
    };
  });

  const isAsc = sortOrder === "asc";
  formattedPages.sort((a, b) => {
    let valA = a[sortBy] !== undefined ? a[sortBy] : a.performanceScore;
    let valB = b[sortBy] !== undefined ? b[sortBy] : b.performanceScore;

    if (sortBy === "score" || sortBy === "performanceScore") {
      valA = a.performanceScore;
      valB = b.performanceScore;
    }

    if (typeof valA === "string") {
      return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return isAsc ? valA - valB : valB - valA;
  });

  const total = formattedPages.length;
  const skip = (page - 1) * limit;
  const paginatedPages = formattedPages.slice(skip, skip + limit);

  return {
    success: true,
    statusCode: 200,
    data: {
      pages: paginatedPages,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    }
  };
}


/**
 * Retrieves performance history for a domain (and optionally a specific url)
 */
async function getPerformanceHistory({ tenantConnection, domainId, url }) {
  const { Domain, DomainReport } = getModels(tenantConnection);

  const domainDoc = await Domain.findOne({
    $or: [
      { _id: mongoose.Types.ObjectId.isValid(domainId) ? domainId : null },
      { dm_id: !isNaN(Number(domainId)) ? Number(domainId) : null }
    ],
    dm_is_deleted: false
  }).lean();

  if (!domainDoc) {
    return { success: false, statusCode: 404, message: "Domain not found" };
  }

  const host = getHostFromUrl(domainDoc.dm_url);

  const matchCriteria = { domain: host };
  if (url) {
    matchCriteria.url = url;
  }

  // We aggregate to group by scan date
  const history = await DomainReport.aggregate([
    { $match: matchCriteria },
    {
      $addFields: {
        calcScore: { $ifNull: ["$lighthousePerformanceScore", { $ifNull: ["$performance.advancedMetrics.performanceScore", "$performance.score"] }] },
        calcFcp: { $ifNull: ["$performance.coreWebVitals.FCP", { $ifNull: ["$performance.fcp", "$performance.firstContentfulPaint"] }] },
        calcLcp: { $ifNull: ["$performance.coreWebVitals.LCP", { $ifNull: ["$performance.lcp", "$performance.largestContentfulPaint"] }] },
        calcSi: { $ifNull: ["$performance.coreWebVitals.SpeedIndex", { $ifNull: ["$performance.speedIndex", "$performance.speed_index"] }] },
        calcTbt: { $ifNull: ["$performance.coreWebVitals.TBT", { $ifNull: ["$performance.tbt", "$performance.totalBlockingTime"] }] },
        calcCls: { $ifNull: ["$performance.coreWebVitals.CLS", { $ifNull: ["$performance.cls", "$performance.cumulativeLayoutShift"] }] },
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$scanDate" } },
        avgScore: { $avg: "$calcScore" },
        avgFcp: { $avg: "$calcFcp" },
        avgLcp: { $avg: "$calcLcp" },
        avgSi: { $avg: "$calcSi" },
        avgTbt: { $avg: "$calcTbt" },
        avgCls: { $avg: "$calcCls" },
        latestDate: { $max: "$scanDate" }
      }
    },
    { $sort: { "_id": -1 } },
    { $limit: 14 }
  ]);

  // Reverse to get chronological order (oldest to newest)
  history.reverse();

  const formattedHistory = history.map(item => {
    return {
      performanceScore: Math.round(item.avgScore || 0),
      fcp: Number((item.avgFcp || 0).toFixed(2)),
      lcp: Number((item.avgLcp || 0).toFixed(2)),
      si: Number((item.avgSi || 0).toFixed(2)),
      tbt: Number((item.avgTbt || 0).toFixed(2)),
      cls: Number((item.avgCls || 0).toFixed(3)),
      date: item.latestDate
    };
  });

  return {
    success: true,
    statusCode: 200,
    data: formattedHistory
  };
}

module.exports = {
  getPerformanceHistory,
  getPerformanceSummary,
  getPerformancePages
};
