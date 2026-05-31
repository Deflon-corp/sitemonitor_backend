const { get_heartbeat_data_service } = require("../services/heartbeat.service");

async function get_heartbeat_data(req, res) {
  try {
    const result = await get_heartbeat_data_service({
      tenantConnection: req.tenantConnection,
      params: req.params,
      query: req.query
    });
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error("Error in get_heartbeat_data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
}

module.exports = {
  get_heartbeat_data
};
