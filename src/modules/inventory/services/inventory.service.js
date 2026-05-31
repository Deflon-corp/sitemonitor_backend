const { domainReportSchema } = require("../../domain/models/domainReport.schema");

class InventoryService {
    /**
     * Get the latest scan job reports
     */
    async getLatestScanReports(tenantConnection, domainName) {
        const DomainReport = tenantConnection.model("DomainReport", domainReportSchema);
        const latestReport = await DomainReport.findOne({ domain: domainName, status: "success" })
            .sort({ scanDate: -1 });
        
        if (!latestReport || !latestReport.jobId) return [];

        return await DomainReport.find({ domain: domainName, jobId: latestReport.jobId, status: "success" });
    }

    /**
     * Get summary counts for inventory types
     */
    async getSummary(tenantConnection, domainName) {
        const reports = await this.getLatestScanReports(tenantConnection, domainName);
        if (reports.length === 0) return null;

        const cssSet = new Set();
        const jsSet = new Set();
        const imageSet = new Set();
        const linkSet = new Set();
        const docSet = new Set();
        const emailSet = new Set();
        let headlinks = 0;
        let forms = 0;
        let iframes = 0;
        let frames = 0;

        reports.forEach(r => {
            (r.files?.js || []).forEach(f => jsSet.add(f.url));
            (r.files?.css || []).forEach(f => cssSet.add(f.url));
            (r.imageAnalysis?.imageLoadDetails || []).forEach(img => imageSet.add(img.url));
            
            // Collect links
            (r.links?.internalUrls || []).forEach(url => linkSet.add(url));
            (r.links?.outboundUrls || []).forEach(url => linkSet.add(url));

            // Documents (PDF, Docx, etc.)
            (r.files?.others || []).forEach(f => {
                if (/\.(pdf|docx|xlsx|pptx|zip|txt)$/i.test(f.url)) {
                    docSet.add(f.url);
                }
            });

            // Headlinks
            headlinks += (r.meta?.hreflang?.length || 0);
            if (r.meta?.canonical) headlinks++;

            // Emails
            (r.textMetrics?.emails || []).forEach(e => emailSet.add(e));

            // Technical counts
            if (r.additionalChecks?.formCount) forms += r.additionalChecks.formCount;
            if (r.additionalChecks?.iframeCount) iframes += r.additionalChecks.iframeCount;
            if (r.additionalChecks?.frameCount) frames += r.additionalChecks.frameCount;
        });

        return {
            htmlPages: reports.length,
            documents: docSet.size,
            images: imageSet.size,
            links: linkSet.size,
            forms: forms,
            headlinks: headlinks,
            iframes: iframes,
            frames: frames,
            css: cssSet.size,
            js: jsSet.size,
            emails: emailSet.size,
            history: await this.getHistory(tenantConnection, domainName)
        };
    }

    /**
     * Get inventory history over time
     */
    async getHistory(tenantConnection, domainName) {
        const DomainReport = tenantConnection.model("DomainReport", domainReportSchema);
        
        // Get unique jobIds for the domain, sorted by date
        const jobs = await DomainReport.aggregate([
            { $match: { domain: domainName, status: "success" } },
            { $group: { 
                _id: "$jobId", 
                scanDate: { $first: "$scanDate" },
                count: { $sum: 1 }
            } },
            { $sort: { scanDate: -1 } },
            { $limit: 10 }
        ]);

        const history = [];
        for (const job of jobs.reverse()) {
            // For each job, we can get counts
            // To make it efficient, we might want to pre-calculate or aggregate
            // For now, let's just get images count for each job
            const reports = await DomainReport.find({ jobId: job._id }, { "imageAnalysis.imageLoadDetails": 1 });
            const imageSet = new Set();
            reports.forEach(r => {
                (r.imageAnalysis?.imageLoadDetails || []).forEach(img => imageSet.add(img.url));
            });

            history.push({
                date: job.scanDate,
                htmlPages: job.count,
                images: imageSet.size
            });
        }

        return history;
    }

    /**
     * Get HTML pages list
     */
    async getHtmlPages(tenantConnection, domainName) {
        const reports = await this.getLatestScanReports(tenantConnection, domainName);
        return reports.map(r => ({
            ...r,
            id: r._id,
            title: r.meta?.title || "(No title found)",
            url: r.url,
            notifications: 
                (r.links?.brokenDetails?.length || 0) + 
                (r.imageAnalysis?.brokenImages?.length || 0) + 
                (r.textMetrics?.misspellings?.length || 0) +
                (r.seoImprovements?.length || 0),
            brokenLinks: (r.links?.brokenDetails || []).map(l => ({ url: l.url || l, responseCode: l.responseCode || "404", type: l.type || "Internal" })),
            brokenImages: (r.imageAnalysis?.brokenImages || []).map(img => ({ url: img.url || img, responseCode: img.responseCode || "404", type: "image", dateFound: r.scanDate })),
            misspellings: (r.textMetrics?.misspellings || []).map((m, i) => ({ id: `ms-${i}`, word: m.word || m, language: m.language || "English", dateFound: r.scanDate, pages: 1 })),
            policies: (r.policies || []),
            accessibility: (r.accessibility || {}),
            seo: (r.seoImprovements || []),
            dataPrivacy: 0, 
            views: 0
        }));
    }

    /**
     * Get CSS files with page counts
     */
    async getCssFiles(tenantConnection, domainName) {
        const reports = await this.getLatestScanReports(tenantConnection, domainName);
        const cssMap = new Map();

        reports.forEach(r => {
            const pageUrls = new Set();
            const cssResources = (r.resources || []).filter(res => res.type === 'stylesheet' || (res.url && res.url.endsWith('.css')));
            const cssFiles = (r.files?.css || []);
            
            [...cssResources, ...cssFiles].forEach(f => {
                if (f.url) pageUrls.add(f.url);
            });

            pageUrls.forEach(url => {
                if (!cssMap.has(url)) {
                    cssMap.set(url, { url, pageCount: 0 });
                }
                cssMap.get(url).pageCount++;
            });
        });

        return Array.from(cssMap.values()).map((f, i) => ({ id: `css-${i}`, ...f }));
    }

    /**
     * Get JS files with page counts
     */
    async getJsFiles(tenantConnection, domainName) {
        const reports = await this.getLatestScanReports(tenantConnection, domainName);
        const jsMap = new Map();

        reports.forEach(r => {
            const pageUrls = new Set();
            const jsResources = (r.resources || []).filter(res => res.type === 'script' || (res.url && res.url.endsWith('.js')));
            const jsFiles = (r.files?.js || []);

            [...jsResources, ...jsFiles].forEach(f => {
                if (f.url) pageUrls.add(f.url);
            });

            pageUrls.forEach(url => {
                if (!jsMap.has(url)) {
                    jsMap.set(url, { url, pageCount: 0 });
                }
                jsMap.get(url).pageCount++;
            });
        });

        return Array.from(jsMap.values()).map((f, i) => ({ id: `js-${i}`, ...f }));
    }

    /**
     * Get Images
     */
    async getImages(tenantConnection, domainName) {
        const reports = await this.getLatestScanReports(tenantConnection, domainName);
        const imgMap = new Map();

        reports.forEach(r => {
            const pageUrls = new Set();
            (r.imageAnalysis?.imageLoadDetails || r.images?.imageLoadDetails || r.imageAnalysis || []).forEach(img => {
                if (img && img.url) pageUrls.add(img.url);
            });

            pageUrls.forEach(url => {
                if (!imgMap.has(url)) {
                    imgMap.set(url, { url, pageCount: 0 });
                }
                imgMap.get(url).pageCount++;
            });
        });

        return Array.from(imgMap.values()).map((img, i) => ({
            id: `img-${i}`,
            ...img
        }));
    }

    /**
     * Get Links
     */
    async getLinks(tenantConnection, domainName) {
        const reports = await this.getLatestScanReports(tenantConnection, domainName);
        const linkMap = new Map();

        reports.forEach(r => {
            (r.links?.internalUrls || []).forEach(url => {
                if (!linkMap.has(url)) linkMap.set(url, { link: url, type: "Internal", responseCode: "200", notifications: 0, views: 0 });
            });
            (r.links?.outboundUrls || []).forEach(url => {
                if (!linkMap.has(url)) linkMap.set(url, { link: url, type: "External", responseCode: "200", notifications: 0, views: 0 });
            });
            (r.links?.brokenDetails || []).forEach(l => {
                const url = typeof l === 'string' ? l : l.url;
                linkMap.set(url, { link: url, type: "Broken", responseCode: l.responseCode || "404", notifications: 1, views: 0 });
            });
        });

        return Array.from(linkMap.values()).map((l, i) => ({
            id: `link-${i}`,
            ...l
        }));
    }

    /**
     * Get Documents
     */
    async getDocuments(tenantConnection, domainName) {
        const reports = await this.getLatestScanReports(tenantConnection, domainName);
        const docMap = new Map();

        reports.forEach(r => {
            (r.files?.others || []).forEach(f => {
                if (/\.(pdf|docx|xlsx|pptx|zip|txt)$/i.test(f.url)) {
                    if (!docMap.has(f.url)) {
                        docMap.set(f.url, { link: f.url, type: "Document", notifications: 0, views: 0 });
                    }
                }
            });
        });

        return Array.from(docMap.values()).map((doc, i) => ({
            id: `doc-${i}`,
            ...doc
        }));
    }

    /**
     * Get Forms (Pages containing forms)
     */
    async getForms(tenantConnection, domainName) {
        const reports = await this.getLatestScanReports(tenantConnection, domainName);
        return reports
            .filter(r => r.additionalChecks?.formCount > 0)
            .map((r, i) => ({
                id: `form-${i}`,
                url: r.url,
                pageCount: r.additionalChecks.formCount
            }));
    }

    /**
     * Get Headlinks
     */
    async getHeadlinks(tenantConnection, domainName) {
        const reports = await this.getLatestScanReports(tenantConnection, domainName);
        const headlinkMap = new Map();

        reports.forEach(r => {
            if (r.meta?.canonical) {
                const url = r.meta.canonical;
                if (!headlinkMap.has(url)) headlinkMap.set(url, { url, pageCount: 0 });
                headlinkMap.get(url).pageCount++;
            }
            (r.meta?.hreflang || []).forEach(url => {
                if (!headlinkMap.has(url)) headlinkMap.set(url, { url, pageCount: 0 });
                headlinkMap.get(url).pageCount++;
            });
        });

        return Array.from(headlinkMap.values()).map((hl, i) => ({
            id: `hl-${i}`,
            ...hl
        }));
    }

    /**
     * Get IFrames
     */
    async getIframes(tenantConnection, domainName) {
        const reports = await this.getLatestScanReports(tenantConnection, domainName);
        return reports
            .filter(r => r.additionalChecks?.iframeCount > 0)
            .map((r, i) => ({
                id: `iframe-${i}`,
                url: r.url,
                pageCount: r.additionalChecks.iframeCount
            }));
    }

    /**
     * Get Frames
     */
    async getFrames(tenantConnection, domainName) {
        const reports = await this.getLatestScanReports(tenantConnection, domainName);
        return reports
            .filter(r => r.additionalChecks?.frameCount > 0)
            .map((r, i) => ({
                id: `frame-${i}`,
                url: r.url,
                pageCount: r.additionalChecks.frameCount
            }));
    }

    /**
     * Get Email Addresses
     */
    async getEmailAddresses(tenantConnection, domainName) {
        const reports = await this.getLatestScanReports(tenantConnection, domainName);
        const emailMap = new Map();

        reports.forEach(r => {
            (r.textMetrics?.emails || []).forEach(email => {
                if (!emailMap.has(email)) {
                    emailMap.set(email, { email, documents: 0, pages: 0 });
                }
                emailMap.get(email).pages++;
            });
        });

        return Array.from(emailMap.values()).map((e, i) => ({
            id: `email-${i}`,
            ...e
        }));
    }
}

module.exports = new InventoryService();
