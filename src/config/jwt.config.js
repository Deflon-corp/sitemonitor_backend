module.exports = {
  accessSecret: process.env.JWT_SECRET || "default_access_secret",
  refreshSecret: process.env.REFRESH_SECRET || "default_refresh_secret",
  accessExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  refreshExpiresIn: process.env.REFRESH_EXPIRES_IN || "7d",
};
