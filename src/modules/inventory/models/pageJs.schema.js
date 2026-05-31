const mongoose = require("mongoose");

const pageJsSchema = new mongoose.Schema(
  {
    scan_id: { type: mongoose.Schema.Types.ObjectId, ref: "DomainScanMaster", required: true, index: true },
    domain_id: { type: mongoose.Schema.Types.ObjectId, ref: "Domain", required: true, index: true },
    page_url: { type: String, required: true },
    js_url: { type: String, required: true },
    status_code: { type: Number, default: 200 },
  },
  { timestamps: true, collection: "page_js" }
);

// Unique constraint to avoid duplicates
pageJsSchema.index({ scan_id: 1, page_url: 1, js_url: 1 }, { unique: true });

module.exports = { pageJsSchema };
