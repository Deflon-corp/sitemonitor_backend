const mongoose = require("mongoose");

// Counter collection for auto-increment fields per-tenant DB
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // sequence name, e.g. "admin_id"
  seq: { type: Number, default: 0 },
});

// This schema is defined once, but attached to each tenant connection via connection.model(...)
const adminSchema = new mongoose.Schema(
  {
    admin_id: {
      type: Number,
      unique: true,
      index: true,
    },
    admin_first_name: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    admin_father_name: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    admin_last_name: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    admin_email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      default: "",
    },
    admin_login_id: {
      type: String,
      trim: true,
      default: "",
    },
    admin_phone: {
      type: String,
      required: true,
      unique: true,
      match: /^[0-9]{10}$/,
      default: "",
    },
    admin_password: {
      type: String,
      required: true,
      default: "",
    },
    admin_add_date: {
      type: Date,
      default: Date.now,
    },
    admin_last_login: {
      type: Date,
      default: null,
    },
    admin_deleted_at: {
      type: Date,
      default: null,
    },
    admin_updated_at: {
      type: Date,
      default: null,
    },
    admin_created_at: {
      type: Date,
      default: Date.now,
    },
    admin_deleted_by: {
      type: String,
      default: null,
    },
    admin_updated_by: {
      type: String,
      default: null,
    },
    admin_created_by: {
      type: String,
      default: null,
    },
    admin_is_deleted: {
      type: Boolean,
      default: false,
    },
    admin_tent_id: {
      type: Number,
      default: null,
      index: true,
    },
    admin_role: {
      type: String,
      default: "admin",
    },
    admin_status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    admin_profile_image: {
      file_name: {
        type: String,
        trim: true,
        default: null,
      },
      file_path: {
        type: String,
        trim: true,
        default: null,
      },
      file_url: {
        type: String,
        trim: true,
        default: null,
      },
      file_size: {
        type: Number, // bytes
        default: null,
      },
      file_type: {
        type: String,
        enum: ["jpg", "jpeg", "png", "webp"],
        default: null,
      },
      created_at: {
        type: Date,
        default: Date.now,
      },
      updated_at: {
        type: Date,
        default: Date.now,
      },
    },
    admin_otp: {
      type: String,
      default: null,
    },
    admin_otp_expiry: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "admins",
  }
);

// Unique admin_login_id when provided (avoid unique on empty string)
adminSchema.index(
  { admin_login_id: 1 },
  {
    unique: true,
    partialFilterExpression: { admin_login_id: { $type: "string", $ne: "" } },
  }
);

// Pre-save hook to auto-increment admin_id for new documents
adminSchema.pre("save", async function (next) {
  if (!this.isNew || this.admin_id != null) {
    return next();
  }

  try {
    const connection = this.constructor.db;

    const Counter =
      connection.models.Counter ||
      connection.model("Counter", counterSchema, "counters");

    const counter = await Counter.findByIdAndUpdate(
      "admin_id",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.admin_id = counter.seq;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = {
  adminSchema,
};

