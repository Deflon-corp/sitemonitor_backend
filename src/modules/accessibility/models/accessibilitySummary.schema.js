const mongoose = require("mongoose");

const accessibilitySummarySchema = new mongoose.Schema(
  {},
  { collection: "accessibility_summaries", strict: false, timestamps: true }
);

accessibilitySummarySchema.index({ domain: 1, scanDate: -1 });

module.exports = { accessibilitySummarySchema };
