const mongoose = require("mongoose");

const pageIframeSchema = new mongoose.Schema(
  {
    scan_id: { type: mongoose.Schema.Types.ObjectId, ref: "DomainScanMaster", required: true, index: true },
    domain_id: { type: mongoose.Schema.Types.ObjectId, ref: "Domain", required: true, index: true },
    page_url: { type: String, required: true },
    iframe_src: { type: String, default: "" },
  },
  { timestamps: true, collection: "page_iframes" }
);

pageIframeSchema.index({ scan_id: 1, page_url: 1, iframe_src: 1 }, { unique: true });

module.exports = { pageIframeSchema };
