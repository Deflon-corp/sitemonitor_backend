const inventoryService = require("../services/inventory.service");

class InventoryController {
    async getSummary(req, res) {
        try {
            const { domain } = req.query;
            if (!domain) return res.status(400).json({ success: false, message: "Domain is required" });

            const summary = await inventoryService.getSummary(req.tenantConnection, domain);
            res.json({ success: true, data: summary });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getHtmlPages(req, res) {
        try {
            const { domain } = req.query;
            if (!domain) return res.status(400).json({ success: false, message: "Domain is required" });

            const pages = await inventoryService.getHtmlPages(req.tenantConnection, domain);
            res.json({ success: true, data: pages });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getCssFiles(req, res) {
        try {
            const { domain } = req.query;
            if (!domain) return res.status(400).json({ success: false, message: "Domain is required" });

            const files = await inventoryService.getCssFiles(req.tenantConnection, domain);
            res.json({ success: true, data: files });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getJsFiles(req, res) {
        try {
            const { domain } = req.query;
            if (!domain) return res.status(400).json({ success: false, message: "Domain is required" });

            const files = await inventoryService.getJsFiles(req.tenantConnection, domain);
            res.json({ success: true, data: files });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getImages(req, res) {
        try {
            const { domain } = req.query;
            if (!domain) return res.status(400).json({ success: false, message: "Domain is required" });

            const images = await inventoryService.getImages(req.tenantConnection, domain);
            res.json({ success: true, data: images });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getLinks(req, res) {
        try {
            const { domain } = req.query;
            if (!domain) return res.status(400).json({ success: false, message: "Domain is required" });

            const links = await inventoryService.getLinks(req.tenantConnection, domain);
            res.json({ success: true, data: links });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getDocuments(req, res) {
        try {
            const { domain } = req.query;
            if (!domain) return res.status(400).json({ success: false, message: "Domain is required" });

            const documents = await inventoryService.getDocuments(req.tenantConnection, domain);
            res.json({ success: true, data: documents });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getForms(req, res) {
        try {
            const { domain } = req.query;
            if (!domain) return res.status(400).json({ success: false, message: "Domain is required" });

            const forms = await inventoryService.getForms(req.tenantConnection, domain);
            res.json({ success: true, data: forms });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getHeadlinks(req, res) {
        try {
            const { domain } = req.query;
            if (!domain) return res.status(400).json({ success: false, message: "Domain is required" });

            const headlinks = await inventoryService.getHeadlinks(req.tenantConnection, domain);
            res.json({ success: true, data: headlinks });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getIframes(req, res) {
        try {
            const { domain } = req.query;
            if (!domain) return res.status(400).json({ success: false, message: "Domain is required" });

            const iframes = await inventoryService.getIframes(req.tenantConnection, domain);
            res.json({ success: true, data: iframes });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getFrames(req, res) {
        try {
            const { domain } = req.query;
            if (!domain) return res.status(400).json({ success: false, message: "Domain is required" });

            const frames = await inventoryService.getFrames(req.tenantConnection, domain);
            res.json({ success: true, data: frames });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getEmailAddresses(req, res) {
        try {
            const { domain } = req.query;
            if (!domain) return res.status(400).json({ success: false, message: "Domain is required" });

            const emails = await inventoryService.getEmailAddresses(req.tenantConnection, domain);
            res.json({ success: true, data: emails });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new InventoryController();
