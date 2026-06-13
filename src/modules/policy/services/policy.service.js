const mongoose = require("mongoose");
const { policySchema } = require("../models/policy.schema");
const { policyReportSchema } = require("../models/policyReport.schema");
const { create_rule_service } = require("../../rule/services/rule.service");
const { ruleSchema } = require("../../rule/models/rule.schema");
const { domainSchema } = require("../../domain/models/domain.schema");


const get_policy_model = (connection) => {
  return connection.models.Policy || connection.model("Policy", policySchema);
};

const get_rule_model = (connection) => {
  return connection.models.Rule || connection.model("Rule", ruleSchema);
};

const get_domain_model = (connection) => {
  return connection.models.Domain || connection.model("Domain", domainSchema, "domains");
};

const get_policy_report_model = (connection) => {
  return connection.models.PolicyReport || connection.model("PolicyReport", policyReportSchema);
};

const get_domain_page_model = (connection) => {
  const { domainPageSchema } = require("../../inventory/models/domainPage.schema");
  return connection.models.DomainPage || connection.model("DomainPage", domainPageSchema, "domain_pages");
};

/**
 * create_policy_service
 */
async function create_policy_service({ tenantConnection, body, tenantId }) {
  try {
    const Policy = get_policy_model(tenantConnection);
    const { rules, title, ...policyData } = body || {};
    
    // Check for duplicate title
    const existingPolicy = await Policy.findOne({ tenantId, title: title.trim(), is_deleted: false });
    if (existingPolicy) {
      return {
        success: false,
        statusCode: 400,
        message: "A policy with this title already exists",
      };
    }

    const newPolicy = new Policy({
      title: title.trim(),
      ...policyData,
      rules: rules || [],
      tenantId,
    });
    await newPolicy.save();

    // Rules are now embedded in the policy document


    return {
      success: true,
      statusCode: 201,
      message: "Policy created successfully",
      data: newPolicy,
    };
  } catch (err) {
    console.error("create_policy_service error:", err);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to create policy",
    };
  }
}

/**
 * get_policy_list_service
 */
async function get_policy_list_service({ tenantConnection, query, tenantId }) {
  try {
    get_domain_model(tenantConnection); // Register Domain model
    const Policy = get_policy_model(tenantConnection);
    const { domainId, category } = query;
    let targetObjectId = domainId;
    if (domainId && !mongoose.Types.ObjectId.isValid(domainId)) {
      const Domain = get_domain_model(tenantConnection);
      const domainDoc = await Domain.findOne({ dm_id: Number(domainId) });
      if (domainDoc) targetObjectId = domainDoc._id;
    }

    const filter = { tenantId, is_deleted: false };
    if (targetObjectId) {
      filter.$or = [
        { isGlobal: true },
        { domainIds: targetObjectId }
      ];
    }
    if (category && category !== "all") filter.category = category;

    const policies = await Policy.find(filter)
      .populate("domainIds", "dm_title dm_url")
      .sort({ createdAt: -1 })
      .lean();

    // Get real-time hits for each policy
    const PolicyReport = get_policy_report_model(tenantConnection);
    const reportFilter = { isHit: true };
    if (targetObjectId && mongoose.Types.ObjectId.isValid(targetObjectId)) {
      reportFilter.domainId = new mongoose.Types.ObjectId(targetObjectId);
    }

    const hitReports = await PolicyReport.aggregate([
      { $match: reportFilter },
      { $group: { _id: "$policyId", count: { $sum: 1 } } }
    ]);

    const hitMap = hitReports.reduce((acc, r) => {
      acc[r._id.toString()] = r.count;
      return acc;
    }, {});

    const policiesWithDynamicData = policies.map(p => ({
      ...p,
      id: p._id || p.id,
      policyHits: hitMap[p._id.toString()] || 0,
      // If a policy has hits, it's not 100% compliant. Simple logic: hits > 0 ? 0 : 100
      compliancePercent: (hitMap[p._id.toString()] || 0) > 0 ? 0 : 100
    }));

    return {
      success: true,
      statusCode: 200,
      message: "Policies retrieved successfully",
      data: policiesWithDynamicData,
    };
  } catch (err) {
    console.error("get_policy_list_service error:", err);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to retrieve policies",
    };
  }
}

/**
 * get_policy_by_id_service
 */
async function get_policy_by_id_service({ tenantConnection, params }) {
  try {
    get_domain_model(tenantConnection); // Register Domain model
    const Policy = get_policy_model(tenantConnection);
    const policy = await Policy.findOne({ _id: params.id, is_deleted: false })
      .populate("domainIds", "dm_title dm_url")
      .lean();

    if (!policy) {
      return {
        success: false,
        statusCode: 404,
        message: "Policy not found",
      };
    }

    // Rules are already embedded
    if (policy.rules) {
      policy.rules = policy.rules.map(r => {
        if (r._id && !r.id) r.id = r._id;
        return r;
      });
    }

    return {
      success: true,
      statusCode: 200,
      message: "Policy retrieved successfully",
      data: policy,
    };
  } catch (err) {
    console.error("get_policy_by_id_service error:", err);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to retrieve policy",
    };
  }
}

/**
 * update_policy_service
 */
async function update_policy_service({ tenantConnection, params, body, tenantId }) {
  try {
    const Policy = get_policy_model(tenantConnection);
    const Rule = get_rule_model(tenantConnection);
    const { rules, title, ...policyData } = body;
    
    // Check for duplicate title if title is being updated
    if (title) {
      const existingPolicy = await Policy.findOne({ _id: { $ne: params.id }, tenantId: tenantId, title: title.trim(), is_deleted: false });
      if (existingPolicy) {
        return {
          success: false,
          statusCode: 400,
          message: "A policy with this title already exists",
        };
      }
    }

    const updatedPolicy = await Policy.findOneAndUpdate(
      { _id: params.id, is_deleted: false },
      { $set: { title: title ? title.trim() : undefined, rules: rules || [], ...policyData } },
      { new: true }
    );

    if (!updatedPolicy) {
      return {
        success: false,
        statusCode: 404,
        message: "Policy not found",
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Policy updated successfully",
      data: updatedPolicy,
    };
  } catch (err) {
    console.error("update_policy_service error:", err);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to update policy",
    };
  }
}

/**
 * delete_policy_service
 */
async function delete_policy_service({ tenantConnection, params }) {
  try {
    const Policy = get_policy_model(tenantConnection);
    const deletedPolicy = await Policy.findOneAndUpdate(
      { _id: params.id, is_deleted: false },
      { $set: { is_deleted: true } },
      { new: true }
    );

    if (!deletedPolicy) {
      return {
        success: false,
        statusCode: 404,
        message: "Policy not found",
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Policy deleted successfully",
    };
  } catch (err) {
    console.error("delete_policy_service error:", err);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to delete policy",
    };
  }
}

/**
 * get_policy_stats_service
 * Fetches stats from the latest PolicySummary for the dashboard charts.
 */
async function get_policy_stats_service({ tenantConnection, query, tenantId }) {
  try {
    const PolicySummary = get_policy_summary_model(tenantConnection);
    const Domain = get_domain_model(tenantConnection);

    const { domainId } = query;
    let targetObjectId = domainId;
    let isScanning = false;
    
    if (domainId && !mongoose.Types.ObjectId.isValid(domainId)) {
      const domainDoc = await Domain.findOne({ dm_id: Number(domainId) });
      if (domainDoc) {
        targetObjectId = domainDoc._id;
        if (domainDoc.dm_policy_status === 'scanning') isScanning = true;
      }
    } else if (domainId) {
      const domainDoc = await Domain.findById(domainId);
      if (domainDoc && domainDoc.dm_policy_status === 'scanning') isScanning = true;
    }

    if (!targetObjectId) {
      return { success: false, statusCode: 404, message: "Domain not found" };
    }

    // Fetch the last 7 summaries to build the trend line
    const recentSummaries = await PolicySummary.find({ 
      domainId: targetObjectId 
    })
    .sort({ scanDate: -1 })
    .limit(7)
    .lean();

    if (!recentSummaries || recentSummaries.length === 0) {
      return {
        success: true,
        statusCode: 200,
        message: "No policy scan data available.",
        data: {
          priorities: [
            { label: "High", value: 0 },
            { label: "Medium", value: 0 },
            { label: "Low", value: 0 },
          ],
          distribution: [
            { label: "Unwanted", value: 0 },
            { label: "Required", value: 0 },
            { label: "Matches", value: 0 },
          ],
          policiesWithViolations: 0,
          contentWithViolations: 0,
          compliancePercent: 100,
          trend: [],
          isScanning
        },
      };
    }

    const latestSummary = recentSummaries[0];

    // Format for charts
    const priorities = [
      { label: "High", value: latestSummary.priorities?.high || 0 },
      { label: "Medium", value: latestSummary.priorities?.medium || 0 },
      { label: "Low", value: latestSummary.priorities?.low || 0 },
    ];

    const distribution = [
      { label: "Unwanted", value: latestSummary.distribution?.unwanted || 0 },
      { label: "Required", value: latestSummary.distribution?.required || 0 },
      { label: "Matches", value: latestSummary.distribution?.matches || 0 },
    ];

    // Format trend (reverse to put oldest first)
    const trend = recentSummaries.reverse().map(summary => ({
      label: new Date(summary.scanDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: summary.contentWithViolations || 0
    }));

    return {
      success: true,
      statusCode: 200,
      message: "Policy stats fetched successfully",
      data: {
        priorities,
        distribution,
        policiesWithViolations: latestSummary.policiesWithViolations || 0,
        contentWithViolations: latestSummary.contentWithViolations || 0,
        compliancePercent: latestSummary.compliancePercent || 100,
        trend,
        isScanning
      },
    };
  } catch (err) {
    console.error("get_policy_stats_service error:", err);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to fetch policy stats",
    };
  }
}

async function get_policy_reports_service({ tenantConnection, params, query }) {
  try {
    get_domain_model(tenantConnection); // Register Domain model
    const PolicyReport = get_policy_report_model(tenantConnection);
    const { id: policyId } = params;
    const { domainId, limit = 100 } = query;

    const filter = { policyId };
    if (domainId) filter.domainId = domainId;

    const reports = await PolicyReport.find(filter)
      .populate("domainId", "dm_title dm_url")
      .sort({ scanDate: -1 })
      .limit(parseInt(limit));

    return {
      success: true,
      statusCode: 200,
      message: "Policy reports retrieved successfully",
      data: reports,
    };
  } catch (err) {
    console.error("get_policy_reports_service error:", err);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to retrieve policy reports",
    };
  }
}

async function get_policy_content_matches_service({ tenantConnection, query, tenantId }) {
  try {
    get_domain_model(tenantConnection);
    get_policy_model(tenantConnection);
    const PolicyReport = get_policy_report_model(tenantConnection);
    const { domainId, limit = 100 } = query;

    let targetObjectId = domainId;
    if (domainId && !mongoose.Types.ObjectId.isValid(domainId)) {
      const Domain = get_domain_model(tenantConnection);
      const domainDoc = await Domain.findOne({ dm_id: Number(domainId) });
      if (domainDoc) targetObjectId = domainDoc._id;
    }

    const matchFilter = { isHit: true };
    if (targetObjectId && mongoose.Types.ObjectId.isValid(targetObjectId)) {
      matchFilter.domainId = new mongoose.Types.ObjectId(targetObjectId);
    }

    const rawMatches = await PolicyReport.find(matchFilter)
      .populate({ path: 'policyId', model: 'Policy', select: 'title' })
      .sort({ scanDate: -1 })
      .limit(parseInt(limit))
      .lean();

    const matches = rawMatches.map(m => ({
      _id: m._id,
      url: m.url,
      domainName: m.domainName,
      policyName: m.policyId?.title || 'Unknown Policy',
      category: m.category,
      priority: m.priority,
      matchCount: m.matchCount,
      scanDate: m.scanDate
    }));

    return {
      success: true,
      statusCode: 200,
      message: "Content matches retrieved successfully",
      data: matches,
    };
  } catch (err) {
    console.error("get_policy_content_matches_service error:", err);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to retrieve content matches",
    };
  }
}

/**
 * scan_domain_policies_service
 * Triggers the policy scan job on the master microservice
 */
async function scan_domain_policies_service({ tenantConnection, domainId, tenantId }) {
  try {
    const Domain = get_domain_model(tenantConnection);

    let targetObjectId = domainId;
    if (domainId && !mongoose.Types.ObjectId.isValid(domainId)) {
      const domainDoc = await Domain.findOne({ dm_id: Number(domainId) });
      if (domainDoc) targetObjectId = domainDoc._id;
    }

    if (!targetObjectId) {
      return { success: false, statusCode: 404, message: "Domain not found" };
    }

    const domainDoc = await Domain.findById(targetObjectId);
    const domainName = domainDoc ? domainDoc.dm_title || domainDoc.dm_url : "Unknown Domain";
    
    // Trigger the master microservice
    const MASTER_URL = process.env.MASTER_MS_URL || "http://localhost:4100";
    const dbName = tenantConnection.name;
    const dbUri = process.env.DB_URL || process.env.MONGODB_URI;

    console.log(`📤 [PolicyService] Enqueuing policy scan job to master ms for domain: ${domainName}`);
    
    const response = await fetch(`${MASTER_URL}/scan/policy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dm_url: domainName,
        domainId: targetObjectId,
        sourceDb: dbName,
        sourceUri: dbUri,
      }),
    });

    if (!response.ok) {
      const resData = await response.json().catch(() => ({}));
      console.error(`❌ [PolicyService] Failed to enqueue master policy scan job`, resData);
      throw new Error(resData?.error || "Failed to enqueue master policy scan job");
    }

    const resData = await response.json();
    console.log(`📩 [PolicyService] Master policy scan job enqueued. Job ID: ${resData.jobId}`);

    // Poll the PolicySummary table to wait for completion
    const PolicySummary = get_policy_summary_model(tenantConnection);
    const maxPollAttempts = 60; // 30 seconds max
    const pollInterval = 500; // 500ms
    let scanFinished = false;

    if (resData.jobId) {
      const jobIdStr = String(resData.jobId);
      for (let i = 0; i < maxPollAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        const summary = await PolicySummary.findOne({ jobId: jobIdStr }).lean();
        if (summary) {
          scanFinished = true;
          console.log(`✅ [PolicyService] Master policy scan job completed. Found summary in DB.`);
          break;
        }
      }
    }

    if (!scanFinished) {
      console.log(`⚠️ [PolicyService] Polling timeout reached. Master job might still be running.`);
    }

    return {
      success: true,
      statusCode: 200,
      message: scanFinished ? "Policy scan completed successfully." : "Policy scan is processing in the background.",
      data: { jobId: resData.jobId }
    };
  } catch (err) {
    console.error("scan_domain_policies_service error:", err);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to scan domain policies",
    };
  }
}

function get_policy_summary_model(connection) {
  const { policySummarySchema } = require("../models/policySummary.schema");
  return connection.model("PolicySummary", policySummarySchema);
}

module.exports = {
  create_policy_service,
  get_policy_list_service,
  get_policy_by_id_service,
  update_policy_service,
  delete_policy_service,
  get_policy_stats_service,
  get_policy_reports_service,
  get_policy_content_matches_service,
  scan_domain_policies_service,
};

