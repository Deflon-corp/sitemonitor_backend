const mongoose = require("mongoose");

const pageDocumentSchema = new mongoose.Schema(
  {
    scan_id: { type: mongoose.Schema.Types.ObjectId, ref: "DomainScanMaster", required: true, index: true },
    domain_id: { type: mongoose.Schema.Types.ObjectId, ref: "Domain", required: true, index: true },
    page_url: { type: String, required: true },
    document_url: { type: String, required: true },
    document_type: { type: String, required: true },
  },
  { timestamps: true, collection: "page_documents" }
);

// Unique constraint to avoid duplicates
pageDocumentSchema.index({ scan_id: 1, page_url: 1, document_url: 1 }, { unique: true });

module.exports = { pageDocumentSchema };
