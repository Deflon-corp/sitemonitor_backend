const mongoose = require("mongoose");

const accessibilityReportSchema = new mongoose.Schema(
  {
    domain: { type: String, required: true, index: true },
    url: { type: String, required: true, index: true },
    title: { type: String, default: "" },
    jobId: { type: String, index: true },
    scanDate: { type: Date, default: Date.now },
    score: { type: Number, default: 0 },
    passedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    warningCount: { type: Number, default: 0 },
    notApplicableCount: { type: Number, default: 0 },
    issues: [{ type: mongoose.Schema.Types.Mixed }],
    passes: [{ type: mongoose.Schema.Types.Mixed }],
  },
  { collection: "accessibility_reports", strict: false, timestamps: true }
);

accessibilityReportSchema.index({ domain: 1, jobId: 1 });

module.exports = { accessibilityReportSchema };
