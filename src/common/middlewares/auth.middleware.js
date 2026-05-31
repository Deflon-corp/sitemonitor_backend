const { verify_jwt_token } = require("../services/jwt.service");

function getBearerToken(req) {
  const authHeader = req.header("authorization") || req.header("Authorization");
  if (!authHeader) return null;

  const [scheme, token] = String(authHeader).split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

/**
 * Auth middleware:
 * - Reads JWT from `Authorization: Bearer <token>`
 * - Verifies signature
 * - Attaches decoded payload to `req.user`
 */
function authMiddleware(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: "Authorization token is required",
      });
    }

    const decoded = verify_jwt_token(token);

    // If token_type is present, only allow access tokens here
    if (decoded && decoded.token_type && decoded.token_type !== "access") {
      return res.status(401).json({
        success: false,
        status: 401,
        message:
          "Access token required. Use the access_token from login; refresh tokens cannot be used for this endpoint.",
      });
    }
    req.user = decoded;
    req.token = token;
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      status: 401,
      message: "Invalid or expired token",
      error: process.env.NODE_ENV === "LOCAL" ? err.message : undefined,
    });
  }
}

module.exports = {
  authMiddleware,
  getBearerToken,
};

