const mongoose = require("mongoose");

// Counter collection for auto-increment fields (base DB)
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // sequence name, e.g. "sa_id"
  seq: { type: Number, default: 0 },
});

const superAdminSchema = new mongoose.Schema(
  {
    sa_id: {
      type: Number,
      unique: true,
      index: true,
    },
    sa_first_name: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    sa_father_name: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    sa_last_name: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    sa_email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      default: "",
    },
    sa_login_id: {
      type: String,
      trim: true,
      default: "",
    },
    sa_phone: {
      type: String,
      required: true,
      unique: true,
      match: /^[0-9]{10}$/,
      default: "",
    },
    sa_password: {
      type: String,
      required: true,
      default: "",
    },
    sa_add_date: {
      type: Date,
      default: Date.now,
    },
    sa_last_login: {
      type: Date,
      default: null,
    },
    sa_deleted_at: {
      type: Date,
      default: null,
    },
    sa_updated_at: {
      type: Date,
      default: null,
    },
    sa_created_at: {
      type: Date,
      default: Date.now,
    },
    sa_deleted_by: {
      type: String,
      default: null,
    },
    sa_updated_by: {
      type: String,
      default: null,
    },
    sa_created_by: {
      type: String,
      default: null,
    },
    sa_is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: "super_admins",
  }
);

// Unique sa_login_id when provided (avoid unique on empty string)
superAdminSchema.index(
  { sa_login_id: 1 },
  {
    unique: true,
    partialFilterExpression: { sa_login_id: { $type: "string", $ne: "" } },
  }
);

// Pre-save hook to auto-increment sa_id for new documents
superAdminSchema.pre("save", async function (next) {
  if (!this.isNew || this.sa_id != null) {
    return next();
  }

  try {
    const connection = this.constructor.db;
    const Counter =
      connection.models.Counter ||
      connection.model("Counter", counterSchema, "counters");

    const counter = await Counter.findByIdAndUpdate(
      "sa_id",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.sa_id = counter.seq;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = {
  superAdminSchema,
};

