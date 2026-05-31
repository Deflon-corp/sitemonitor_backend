const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventory.controller");
const { authMiddleware } = require("../../../common/middlewares/auth.middleware");

router.get("/summary", authMiddleware, inventoryController.getSummary);
router.get("/html-pages", authMiddleware, inventoryController.getHtmlPages);
router.get("/css", authMiddleware, inventoryController.getCssFiles);
router.get("/js", authMiddleware, inventoryController.getJsFiles);
router.get("/images", authMiddleware, inventoryController.getImages);
router.get("/links", authMiddleware, inventoryController.getLinks);
router.get("/documents", authMiddleware, inventoryController.getDocuments);
router.get("/forms", authMiddleware, inventoryController.getForms);
router.get("/headlinks", authMiddleware, inventoryController.getHeadlinks);
router.get("/iframes", authMiddleware, inventoryController.getIframes);
router.get("/frames", authMiddleware, inventoryController.getFrames);
router.get("/email-addresses", authMiddleware, inventoryController.getEmailAddresses);

module.exports = router;
