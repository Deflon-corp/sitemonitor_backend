const { activityLogSchema } = require("../models/activityLog.schema");

function getActivityLogModel(connection) {
  return connection.models.ActivityLog || connection.model("ActivityLog", activityLogSchema, "activity_logs");
}

async function get_logs_service({ tenantConnection }) {
  const ActivityLog = getActivityLogModel(tenantConnection);
  const logs = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return {
    statusCode: 200,
    success: true,
    message: "Logs retrieved successfully",
    data: logs,
  };
}

async function delete_logs_service({ tenantConnection }) {
  const ActivityLog = getActivityLogModel(tenantConnection);
  await ActivityLog.deleteMany({});
  return {
    statusCode: 200,
    success: true,
    message: "All logs deleted successfully",
  };
}

module.exports = {
  get_logs_service,
  delete_logs_service,
};
