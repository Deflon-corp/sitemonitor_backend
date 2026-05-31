const mongoose = require("mongoose");

const pageEmailSchema = new mongoose.Schema(
  {
    scan_id: { type: mongoose.Schema.Types.ObjectId, ref: "DomainScanMaster", required: true, index: true },
    domain_id: { type: mongoose.Schema.Types.ObjectId, ref: "Domain", required: true, index: true },
    page_url: { type: String, required: true },
    email_address: { type: String, required: true },
  },
  { timestamps: true, collection: "page_emails" }
);

// Unique constraint to avoid duplicates
pageEmailSchema.index({ scan_id: 1, page_url: 1, email_address: 1 }, { unique: true });

module.exports = { pageEmailSchema };
