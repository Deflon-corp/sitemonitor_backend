const jwt = require("jsonwebtoken");

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

function getAccessExpiry() {
  // Prefer new env name, but keep backward compatibility
  return process.env.JWT_EXPIRY || process.env.JWT_EXPIRES_IN || "1h";
}

function getRefreshExpiry() {
  return process.env.REFRESH_EXPIRY || "7d";
}

/**
 * get_jwt_token
 * signs payload and returns JWT string.
 * Default usage is for access tokens.
 */
function get_jwt_token(payload, options = {}) {
  const secret = getSecret();
  const signOptions = {
    expiresIn: getAccessExpiry(),
    ...options,
  };
  return jwt.sign(payload, secret, signOptions);
}

/**
 * get_access_token
 * Explicit helper for access tokens using JWT_EXPIRY
 */
function get_access_token(payload, options = {}) {
  const secret = getSecret();
  const signOptions = {
    expiresIn: getAccessExpiry(),
    ...options,
  };
  const finalPayload = {
    ...payload,
    token_type: payload.token_type || "access",
  };
  return jwt.sign(finalPayload, secret, signOptions);
}

/**
 * get_refresh_token
 * Helper for issuing refresh tokens using REFRESH_EXPIRY
 */
function get_refresh_token(payload, options = {}) {
  const secret = getSecret();
  const signOptions = {
    expiresIn: getRefreshExpiry(),
    ...options,
  };
  const finalPayload = {
    ...payload,
    token_type: payload.token_type || "refresh",
  };
  return jwt.sign(finalPayload, secret, signOptions);
}

/**
 * verify_jwt_token
 * verifies token and returns decoded payload (or throws on error)
 */
function verify_jwt_token(token) {
  const secret = getSecret();
  return jwt.verify(token, secret);
}

/**
 * get_jwt_token_data
 * decodes token without verifying signature (use carefully)
 */
function get_jwt_token_data(token) {
  return jwt.decode(token);
}

module.exports = {
  get_jwt_token,
  get_access_token,
  get_refresh_token,
  verify_jwt_token,
  get_jwt_token_data,
};

