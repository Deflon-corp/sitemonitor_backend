const mongoose = require("mongoose");

// Counter schema (shared across models that need auto-increment)
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // e.g. "user_id"
    seq: { type: Number, default: 0 },
});

// ────────────────────────────────────────────────
//                USER SCHEMA
// ────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
    {
        user_id: { type: Number, unique: true }, // Auto-incrementing ID
        user_first_name: { type: String, required: true },
        user_last_name: { type: String },
        user_phone: { type: String, required: true },
        user_email: { type: String, required: true, unique: true },
        user_password: { type: String, required: true },
        user_language: { type: String, default: "en" },
        user_is_account_admin: { type: Boolean, default: false },
        user_enable_export_notification: { type: Boolean, default: false },
        user_send_welcome_mail: { type: Boolean, default: true },
        user_status: {
            type: String,
            enum: ["active", "inactive", "suspended", "locked", "expired"],
            default: "active",
            index: true,
        },
        user_login_id: {
            type: String,
            trim: true,
            lowercase: true,
            sparse: true,
        },
        // Permissions (stored as individual user_ prefixed fields or nested)
        user_all_modules_access: { type: Boolean, default: true },
        user_visible_policies: { type: Boolean, default: true },
        user_visible_qa: { type: Boolean, default: true },
        user_visible_accessibility: { type: Boolean, default: true },
        user_visible_seo: { type: Boolean, default: true },
        user_visible_heartbeat: { type: Boolean, default: true },
        user_visible_inventory: { type: Boolean, default: true },
        user_visible_statistics: { type: Boolean, default: true },
        user_visible_prioritized_content: { type: Boolean, default: true },
        user_visible_performance: { type: Boolean, default: true },

        user_last_login: {
            type: Date,
            default: null,
        },

        user_expiry_at: {
            type: Date,
            default: null, // null = never expires
        },


        user_other_info: {
            type: mongoose.Schema.Types.Mixed, // flexible key-value / nested data
            default: {},
        },
        // Domain bindings
        user_domains: [{
            dm_id: { type: String },
            visible: { type: Boolean, default: false },
            send_report: { type: Boolean, default: false }
        }],

        // Audit fields
        user_created_at: {
            type: Date,
            default: Date.now,
        },

        user_updated_at: {
            type: Date,
            default: null,
        },

        user_deleted_at: {
            type: Date,
            default: null,
        },

        user_is_deleted: {
            type: Boolean,
            default: false,
            index: true,
        },
        user_is_archived: {
            type: Boolean,
            default: false,
            index: true,
        },

        user_created_by: {
            type: Number,
            default: null,
            ref: "User",
        },

        user_updated_by: {
            type: Number,
            default: null,
            ref: "User",
        },

        user_deleted_by: {
            type: Number,
            default: null,
            ref: "User",
        },

        user_otp: {
            type: String,
            default: null,
        },

        user_otp_expiry: {
            type: Date,
            default: null,
        },
    },
    {
        collection: "users",
        timestamps: false,
    }
);

// Optional: compound index for frequent queries
userSchema.index({ user_email: 1, user_is_deleted: 1 });
userSchema.index({ user_phone: 1, user_is_deleted: 1 });

// ────────────────────────────────────────────────
//        AUTO-INCREMENT user_id (like your admin example)
// ────────────────────────────────────────────────
userSchema.pre("save", async function (next) {
    if (!this.isNew || this.user_id != null) {
        return next();
    }

    try {
        const connection = this.constructor.db;

        const Counter =
            connection.models.Counter ||
            connection.model("Counter", counterSchema, "counters");

        const counter = await Counter.findByIdAndUpdate(
            "user_id",
            { $inc: { seq: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        this.user_id = counter.seq;
        next();
    } catch (err) {
        next(err);
    }
});

// Optional: update timestamp on save
userSchema.pre("save", function (next) {
    if (this.isModified()) {
        this.user_updated_at = new Date();
    }
    next();
});

// For soft-delete queries (you can create a query helper or middleware)
userSchema.pre(/^find/, function (next) {
    // Automatically filter out deleted records unless explicitly asked
    if (!this.getFilter().includeDeleted) {
        this.where({ user_is_deleted: false });
    }
    next();
});

module.exports = {
    userSchema,
};