const mongoose = require("mongoose");

const domainPageSchema = new mongoose.Schema(
  {
    scan_id: { type: mongoose.Schema.Types.ObjectId, ref: "DomainScanMaster", required: true, index: true },
    domain_id: { type: mongoose.Schema.Types.ObjectId, ref: "Domain", required: true, index: true },
    page_url: { type: String, required: true },
    status_code: { type: Number, required: true },
    page_title: { type: String },
  },
  { timestamps: true, collection: "domain_pages" }
);

// Unique constraint to avoid duplicates
domainPageSchema.index({ scan_id: 1, page_url: 1 }, { unique: true });

module.exports = { domainPageSchema };
