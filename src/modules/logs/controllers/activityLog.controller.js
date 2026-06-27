const { get_logs_service, delete_logs_service } = require("../services/activityLog.service");

async function getLogs(req, res, next) {
  try {
    const result = await get_logs_service({
      tenantConnection: req.tenantConnection,
    });
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteLogs(req, res, next) {
  try {
    const result = await delete_logs_service({
      tenantConnection: req.tenantConnection,
    });
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLogs,
  deleteLogs,
};
