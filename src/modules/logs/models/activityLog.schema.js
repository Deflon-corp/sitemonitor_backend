const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  userName: {
    type: String,
    required: false,
  },
  action: {
    type: String, // e.g. 'CREATE_DOMAIN', 'UPDATE_DOMAIN', 'DELETE_DOMAIN', 'CREATE_USER', 'SCAN_COMPLETED', 'SCAN_FAILED'
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, {
  collection: "activity_logs",
  timestamps: { createdAt: "createdAt", updatedAt: false },
});

module.exports = {
  activityLogSchema,
};
