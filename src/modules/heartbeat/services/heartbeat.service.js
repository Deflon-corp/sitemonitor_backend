const mongoose = require("mongoose");
const { domainSchema } = require("../../domain/models/domain.schema");
const { domainSummarySchema } = require("../../domain/models/domainSummary.schema");

function getDomainModel(connection) {
  return (
    connection.models.Domain ||
    connection.model("Domain", domainSchema, "domains")
  );
}

function getDomainSummaryModel(connection) {
  return (
    connection.models.DomainSummary ||
    connection.model("DomainSummary", domainSummarySchema, "domain_summaries")
  );
}

async function get_heartbeat_data_service({ tenantConnection, params, query }) {
  const { domainId } = params;
  let { startDate, endDate } = query;
  
  const Domain = getDomainModel(tenantConnection);
  const DomainSummary = getDomainSummaryModel(tenantConnection);

  let domainDoc;
  if (mongoose.Types.ObjectId.isValid(domainId)) {
    domainDoc = await Domain.findOne({ _id: domainId, dm_is_deleted: false });
  }
  
  if (!domainDoc && !isNaN(Number(domainId))) {
    domainDoc = await Domain.findOne({ dm_id: Number(domainId), dm_is_deleted: false });
  }

  if (!domainDoc) {
    return { statusCode: 404, success: false, message: "Domain not found" };
  }

  const host = domainDoc.dm_url.toLowerCase().trim().replace(/^https?[:/\\]+/i, '').replace(/[/\\]+.*$/, '');
  
  // Default date range if not provided
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date();
  if (!startDate) {
    start.setDate(end.getDate() - 90); // default last 90 days
  }

  // Fetch summaries
  const summaries = await DomainSummary.find({
    domain: host,
    lastScanDate: { $gte: start, $lte: end }
  }).sort({ lastScanDate: 1 }); // Sort ascending for chart

  // Format data
  let responseTimeSample = [];
  let incidentSample = [];
  let outagesSample = [];
  let totalResponseMs = 0;
  let validResponseCount = 0;
  let incidents = 0;
  let dates = [];

  summaries.forEach((summary) => {
    // parse averageLoadTime
    let loadTimeMs = 0;
    if (summary.averageLoadTime) {
      const parsed = parseFloat(summary.averageLoadTime);
      if (!isNaN(parsed)) {
        if (summary.averageLoadTime.includes('ms')) {
           loadTimeMs = parsed;
        } else if (summary.averageLoadTime.includes('s')) {
           loadTimeMs = parsed * 1000;
        } else {
           loadTimeMs = parsed; // default assume ms if no unit but it was a number
        }
      }
    }

    responseTimeSample.push(loadTimeMs);
    dates.push(summary.lastScanDate);
    
    if (loadTimeMs > 0) {
       totalResponseMs += loadTimeMs;
       validResponseCount++;
    }

    if (!summary.rootHttpStatus || summary.rootHttpStatus >= 400) {
      incidents++;
      incidentSample.push(10); // Example 10 min downtime for incident
      outagesSample.push({
        start: summary.lastScanDate.toISOString(),
        end: new Date(summary.lastScanDate.getTime() + 10 * 60000).toISOString(),
        duration: "10 minutes"
      });
    } else {
      incidentSample.push(0);
    }
  });

  const avgResponseMs = validResponseCount > 0 ? Math.round(totalResponseMs / validResponseCount) : 0;
  const totalScans = summaries.length || 1;
  const uptimePercent = summaries.length === 0 ? "100.00" : (((totalScans - incidents) / totalScans) * 100).toFixed(2);

  // Provide fallback sample data if no summaries exist (for better UX when no scans)
  if (summaries.length === 0) {
    // If no scans, we just return empty or default
    return {
      statusCode: 200,
      success: true,
      message: "No heartbeat data available",
      data: {
        inspectingUrl: domainDoc.dm_url,
        responseTimeSample: [],
        incidentSample: [],
        outagesSample: [],
        avgResponseMs: 0,
        uptimePercent: "100.00",
        incidents: 0,
        dates: []
      }
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: "Heartbeat data retrieved",
    data: {
      inspectingUrl: domainDoc.dm_url,
      responseTimeSample,
      incidentSample,
      outagesSample,
      avgResponseMs,
      uptimePercent,
      incidents,
      dates
    }
  };
}

module.exports = {
  get_heartbeat_data_service
};
