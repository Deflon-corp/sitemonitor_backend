const express = require("express");
const router = express.Router();
const qaController = require("../controllers/qa.controller");
const { authMiddleware } = require("../../../common/middlewares/auth.middleware");

router.post("/scan/:domainId", authMiddleware, qaController.triggerQaScan);
router.get("/scan-status/:domainId", authMiddleware, qaController.getScanStatus);
router.get("/summary/:domainId", authMiddleware, qaController.getSummary);
router.get("/page-detail/:domainId", authMiddleware, qaController.getPageDetail);
router.get("/pages/:domainId", authMiddleware, qaController.getPages);
router.get("/broken-links/:domainId", authMiddleware, qaController.getBrokenLinks);
router.get("/broken-links-sitemap/:domainId", authMiddleware, qaController.getBrokenLinksSitemap);
router.get("/broken-link-pages/:domainId", authMiddleware, qaController.getBrokenLinkPages);
router.get("/broken-images/:domainId", authMiddleware, qaController.getBrokenImages);
router.get("/misspellings/:domainId", authMiddleware, qaController.getMisspellings);
router.get("/spellcheck-summary/:domainId", authMiddleware, qaController.getSpellcheckSummary);
router.get("/readability/:domainId", authMiddleware, qaController.getReadability);
router.get("/readability-pages/:domainId", authMiddleware, qaController.getReadabilityPages);
router.patch("/link-status/:domainId", authMiddleware, qaController.patchLinkStatus);

module.exports = router;
