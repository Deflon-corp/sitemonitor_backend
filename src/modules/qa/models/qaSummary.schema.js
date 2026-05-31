const mongoose = require("mongoose");

const qaSummarySchema = new mongoose.Schema(
  {},
  { collection: "qa_summaries", strict: false, timestamps: true }
);

qaSummarySchema.index({ domain: 1, scanDate: -1 });

module.exports = { qaSummarySchema };
