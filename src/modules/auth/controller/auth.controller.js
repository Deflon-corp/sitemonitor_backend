const authService = require("../services/auth.service.js");

async function login(req, res, next) {
  try {
    const payload = {
      login_id: req.body.login_id,
      password: req.body.password,
      tenantConnection: req.tenantConnection, // from tenant middleware
    };

    const result = await authService.authenticateUser(payload);

    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    next(error);
  }
}

async function refreshToken(req, res, next) {
  try {
    const payload = {
      refresh_token: req.body.refresh_token,
      tenantConnection: req.tenantConnection,
    };

    const result = await authService.refreshAuthToken(payload);

    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    next(error);
  }
}

async function sendOTP(req, res, next) {
  try {
    const payload = {
      login_id: req.body.login_id,
      tenantConnection: req.tenantConnection,
    };

    const result = await authService.sendOTP(payload);

    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    next(error);
  }
}

async function verifyOTP(req, res, next) {
  try {
    const payload = {
      login_id: req.body.login_id,
      otp: req.body.otp,
      tenantConnection: req.tenantConnection,
    };

    const result = await authService.verifyOTPAndLogin(payload);

    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  refreshToken,
  sendOTP,
  verifyOTP,
};
