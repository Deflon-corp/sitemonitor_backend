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
 */
async function get_policy_stats_service({ tenantConnection, query, tenantId }) {
  try {
    get_domain_model(tenantConnection); // Register Domain model
    const Policy = get_policy_model(tenantConnection);
    const PolicyReport = get_policy_report_model(tenantConnection);

    const { domainId } = query;
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

    const policies = await Policy.find(filter);

    const reportFilter = {};
    if (targetObjectId && mongoose.Types.ObjectId.isValid(targetObjectId)) {
      reportFilter.domainId = new mongoose.Types.ObjectId(targetObjectId);
    }

    const priorities = [
      { label: "High", value: policies.filter((p) => p.priority === "High").length },
      { label: "Medium", value: policies.filter((p) => p.priority === "Medium").length },
      { label: "Low", value: policies.filter((p) => p.priority === "Low").length },
    ];

    const distribution = [
      { label: "Unwanted", value: policies.filter((p) => p.category === "unwanted").length },
      { label: "Required", value: policies.filter((p) => p.category === "required").length },
      { label: "Matches", value: policies.filter((p) => p.category === "matches").length },
    ];

    const policiesWithViolations = policies.filter((p) => (p.policyHits || 0) > 0).length;
    
    // Count unique pages with violations
    const uniquePagesRaw = await PolicyReport.distinct("url", reportFilter);
    const contentWithViolations = uniquePagesRaw.length;
    
    // Calculate overall compliance (simple average for now)
    const compliancePercent = policies.length > 0 
      ? policies.reduce((acc, p) => acc + (p.compliancePercent || 0), 0) / policies.length 
      : 100;

    // Get trend data (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendRaw = await PolicyReport.aggregate([
      { $match: { ...reportFilter, scanDate: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$scanDate" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days
    const trend = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const match = trendRaw.find(t => t._id === dateStr);
      trend.push({ label: dateStr, value: match ? match.count : 0 });
    }

    return {
      success: true,
      statusCode: 200,
      message: "Policy stats retrieved successfully",
      data: {
        priorities,
        distribution,
        policiesWithViolations,
        contentWithViolations,
        compliancePercent,
        trend,
      },
    };
  } catch (err) {
    console.error("get_policy_stats_service error:", err);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to retrieve policy stats",
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

    const matches = await PolicyReport.aggregate([
      { $match: matchFilter },
      { $sort: { scanDate: -1 } },
      {
        $group: {
          _id: "$url",
          url: { $first: "$url" },
          domainName: { $first: "$domainName" },
          unwanted: { $sum: { $cond: [{ $eq: ["$category", "unwanted"] }, 1, 0] } },
          required: { $sum: { $cond: [{ $eq: ["$category", "required"] }, 1, 0] } },
          matches: { $sum: { $cond: [{ $eq: ["$category", "matches"] }, 1, 0] } },
          highestPriority: {
            $min: {
              $cond: [
                { $eq: ["$priority", "High"] }, 1,
                { $cond: [{ $eq: ["$priority", "Medium"] }, 2, 3] }
              ]
            }
          }
        }
      },
      {
        $project: {
          url: 1,
          domainName: 1,
          unwanted: 1,
          required: 1,
          matches: 1,
          priority: {
            $cond: [
              { $eq: ["$highestPriority", 1] }, "High",
              { $cond: [{ $eq: ["$highestPriority", 2] }, "Medium", "Low"] }
            ]
          }
        }
      },
      { $limit: parseInt(limit) }
    ]);

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

module.exports = {
  create_policy_service,
  get_policy_list_service,
  get_policy_by_id_service,
  update_policy_service,
  delete_policy_service,
  get_policy_stats_service,
  get_policy_reports_service,
  get_policy_content_matches_service,
};

