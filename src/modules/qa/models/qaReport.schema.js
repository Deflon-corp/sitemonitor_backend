const mongoose = require("mongoose");

const qaReportSchema = new mongoose.Schema(
  {
    domain: { type: String, required: true, index: true },
    url: { type: String, required: true, index: true },
    title: { type: String, default: "" },
    jobId: { type: String, index: true },
    scanDate: { type: Date, default: Date.now },
    httpStatus: { type: Number, default: 200 },
    readabilityScore: { type: Number, default: 0 },
    readabilityLevel: { type: String, default: "" },
    issueCount: { type: Number, default: 0 },
    hasQaErrors: { type: Boolean, default: false },
    brokenLinks: [{ type: mongoose.Schema.Types.Mixed }],
    brokenImages: [{ type: mongoose.Schema.Types.Mixed }],
    misspellings: [{ type: mongoose.Schema.Types.Mixed }],
    potentialMisspellings: [{ type: mongoose.Schema.Types.Mixed }],
  },
  { collection: "qa_reports", strict: false, timestamps: true }
);

qaReportSchema.index({ domain: 1, jobId: 1 });

module.exports = { qaReportSchema };
