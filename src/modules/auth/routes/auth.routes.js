const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.controller.js");
const { loginValidationMiddleware, refreshTokenValidationMiddleware } = require("../helper/auth.helper.js");

// Routes
router.post("/login", loginValidationMiddleware, authController.login);
router.post("/refresh-token", refreshTokenValidationMiddleware, authController.refreshToken);
router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);

module.exports = router;
