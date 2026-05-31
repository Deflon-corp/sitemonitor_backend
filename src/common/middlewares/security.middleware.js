/**
 * Security middlewares - helmet and rate limiting.
 * Uses optional requires; if packages are not installed, returns noop middlewares.
 */
let helmetMiddleware = (req, res, next) => next();
let authRateLimiter = (req, res, next) => next();
let apiRateLimiter = (req, res, next) => next();

try {
  const helmet = require("helmet");
  helmetMiddleware = helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });
} catch {
  // helmet not installed - use noop
}

try {
  const rateLimit = require("express-rate-limit");
  authRateLimiter = rateLimit({
    windowMs: 1000, // 1 second
    max: 20,        // 20 requests per second
    message: { success: false, message: "Too many attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  apiRateLimiter = rateLimit({
    windowMs: 1000, // 1 second
    max: 20,        // 20 requests per second
    message: { success: false, message: "Too many requests. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });
} catch {
  // express-rate-limit not installed - use noop
}

module.exports = {
  helmetMiddleware,
  authRateLimiter,
  apiRateLimiter,
};
