const Ajv = require("ajv");
const ajv = new Ajv();

const loginSchema = {
  type: "object",
  properties: {
    login_id: { type: "string" },
    password: { type: "string", minLength: 1 },
  },
  required: ["login_id", "password"],
  additionalProperties: false,
};

const refreshTokenSchema = {
  type: "object",
  properties: {
    refresh_token: { type: "string", minLength: 1 },
  },
  required: ["refresh_token"],
  additionalProperties: false,
};

const validateLogin = ajv.compile(loginSchema);
const validateRefreshToken = ajv.compile(refreshTokenSchema);

/**
 * Express middleware to validate login request body
 */
function loginValidationMiddleware(req, res, next) {
  const isValid = validateLogin(req.body);
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: "Invalid login data",
      errors: validateLogin.errors,
    });
  }
  next();
}

/**
 * Express middleware to validate refresh token request body
 */
function refreshTokenValidationMiddleware(req, res, next) {
  const isValid = validateRefreshToken(req.body);
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: "Invalid refresh token data",
      errors: validateRefreshToken.errors,
    });
  }
  next();
}

module.exports = {
  loginValidationMiddleware,
  refreshTokenValidationMiddleware,
};
