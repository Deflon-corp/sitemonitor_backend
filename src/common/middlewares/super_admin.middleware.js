const { authMiddleware } = require("./auth.middleware");

/**
 * Requires a valid JWT with role = "super_admin"
 */
function superAdminMiddleware(req, res, next) {
  return authMiddleware(req, res, () => {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        status: 403,
        message: "Super admin access required",
      });
    }
    return next();
  });
}

module.exports = {
  superAdminMiddleware,
};

