const jwt = require("jsonwebtoken");
const config = require("../config/jwt.config");

/**
 * Generate an Access Token
 * @param {object} payload 
 * @returns {string}
 */
function signAccessToken(payload) {
  return jwt.sign(payload, config.accessSecret, {
    expiresIn: config.accessExpiresIn,
  });
}

/**
 * Generate a Refresh Token
 * @param {object} payload 
 * @returns {string}
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, config.refreshSecret, {
    expiresIn: config.refreshExpiresIn,
  });
}

/**
 * Verify a Token
 * @param {string} token 
 * @param {boolean} isRefresh 
 * @returns {object}
 */
function verifyToken(token, isRefresh = false) {
  const secret = isRefresh ? config.refreshSecret : config.accessSecret;
  return jwt.verify(token, secret);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyToken,
};
