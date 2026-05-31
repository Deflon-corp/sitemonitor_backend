const mongoose = require("mongoose");

const pageLinkSchema = new mongoose.Schema(
  {
    scan_id: { type: mongoose.Schema.Types.ObjectId, ref: "DomainScanMaster", required: true, index: true },
    domain_id: { type: mongoose.Schema.Types.ObjectId, ref: "Domain", required: true, index: true },
    page_url: { type: String, required: true },
    link_url: { type: String, required: true },
    link_type: { type: String, enum: ["internal", "external"], required: true },
    status_code: { type: Number, default: 200 },
    anchor_text: { type: String, default: "" },
  },
  { timestamps: true, collection: "page_links" }
);

// Compound unique index to prevent duplicates
pageLinkSchema.index({ scan_id: 1, page_url: 1, link_url: 1 }, { unique: true });

module.exports = { pageLinkSchema };
