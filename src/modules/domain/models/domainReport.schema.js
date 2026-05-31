const mongoose = require("mongoose");

const domainReportSchema = new mongoose.Schema(
  {
    domain: { type: String, required: true, index: true },
    url: { type: String, required: true },
    httpStatus: { type: Number },
    scanDate: { type: Date, default: Date.now, index: -1 },
    performance: mongoose.Schema.Types.Mixed,
    networkMetrics: mongoose.Schema.Types.Mixed,
    resources: [mongoose.Schema.Types.Mixed],
    imageAnalysis: mongoose.Schema.Types.Mixed,
    loadingSummary: mongoose.Schema.Types.Mixed,
    headings: mongoose.Schema.Types.Mixed,
    textMetrics: mongoose.Schema.Types.Mixed,
    links: mongoose.Schema.Types.Mixed,
    images: mongoose.Schema.Types.Mixed,
    files: mongoose.Schema.Types.Mixed,
    meta: mongoose.Schema.Types.Mixed,
    accessibility: mongoose.Schema.Types.Mixed,
    policies: mongoose.Schema.Types.Mixed,
    cssAnalysis: mongoose.Schema.Types.Mixed,
    jsAnalysis: mongoose.Schema.Types.Mixed,
    security: mongoose.Schema.Types.Mixed,
    additionalChecks: mongoose.Schema.Types.Mixed,
    lighthouseSeoScore: Number,
    seoScore: Number,
    seoScoreOutOf: { type: Number, default: 100 },
    jobId: { type: String, index: true },
    sourceDomainDocId: { type: mongoose.Schema.Types.ObjectId, ref: "Domain", index: true },
    scanCompletedAt: { type: Date },
    scanDurationMs: { type: Number },
    status: { type: String, enum: ["success", "failed"], index: true },
    seoImprovements: [mongoose.Schema.Types.Mixed],
  },
  { timestamps: true, collection: "domain_reports", strict: false }
);

domainReportSchema.index({ domain: 1, url: 1, scanDate: -1 });

module.exports = { domainReportSchema };
