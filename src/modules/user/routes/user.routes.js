const express = require("express");
const router = express.Router();
const userController = require("../controller/user.controller.js");
const { authMiddleware } = require("../../../common/middlewares/auth.middleware.js");
const { adminMiddleware } = require("../../../common/middlewares/admin.middleware.js");


// CRUD Routes following same pattern as admin routes
router.post("/", adminMiddleware, userController.createUser);
router.post("/login", userController.loginUser);
router.get("/", adminMiddleware, userController.getUserList);
router.get("/:user_id", adminMiddleware, userController.getUserById);
router.put("/:user_id", adminMiddleware, userController.updateUser);
router.delete("/:user_id", adminMiddleware, userController.deleteUser);

// Archive route
router.post("/archive/:user_id", adminMiddleware, userController.archiveUser);

// Restore route
router.post("/restore/:user_id", adminMiddleware, userController.restoreUser);

// Hard delete route
router.delete("/hard-delete/:user_id", adminMiddleware, userController.hardDeleteUser);

// Removed separate profile image route

module.exports = router;

