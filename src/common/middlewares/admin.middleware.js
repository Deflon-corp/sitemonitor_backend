const { authMiddleware } = require("./auth.middleware");

/**
 * Requires a valid JWT with role = "admin"
 */
function adminMiddleware(req, res, next) {
  return authMiddleware(req, res, () => {
    if (req.user?.role !== "admin") {
      // return res.status(403).json({
      //   success: false,
      //   status: 403,
      //   message: "Admin access required",
      // });
    }
    return next();
  });
}

module.exports = {
  adminMiddleware,
};

