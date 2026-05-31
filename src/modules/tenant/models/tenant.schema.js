const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const tenantSchema = new mongoose.Schema(
  {
    tent_id: {
      type: Number,
      unique: true,
      index: true,
    },
    tent_name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    tent_domain: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    tent_expiry_date: {
      type: Date,
      default: () => {
        const date = new Date();
        date.setDate(date.getDate() + 15); // add 15 days
        return date;
      },
    },
    tent_status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    tent_plan: {
      type: String,
      default: "basic",
    },
    tent_add_date: {
      type: Date,
      default: Date.now,
    },
    tent_created_at: {
      type: Date,
      default: Date.now,
    },
    tent_updated_at: {
      type: Date,
      default: Date.now,
    },
    tent_deleted_at: {
      type: Date,
      default: null,
    },
    tent_created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    tent_updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    tent_deleted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    tent_is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  { collection: "tenants" }
);

tenantSchema.pre("save", function (next) {
  if (!this.isNew && this.isModified()) {
    this.tent_updated_at = new Date();
  }
  next();
});

tenantSchema.pre("save", async function (next) {
  if (!this.isNew || this.tent_id != null) {
    return next();
  }
  try {
    const connection = this.constructor.db;
    const Counter =
      connection.models.Counter ||
      connection.model("Counter", counterSchema, "counters");
    const counter = await Counter.findByIdAndUpdate(
      "tent_id",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.tent_id = counter.seq;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = {
  tenantSchema,
};
