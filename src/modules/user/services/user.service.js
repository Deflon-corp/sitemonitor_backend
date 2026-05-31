const bcrypt = require("bcrypt");
const { userSchema } = require("../models/user.model.js");
const { getTenantConnection } = require("../../../config/mongooseTenant.js");
const {
  get_access_token,
  get_refresh_token,
  verify_jwt_token,
} = require("../../../common/services/jwt.service.js");


function isEmail(value) {
  return typeof value === "string" && /\\S+@\\S+\\.\\S+/.test(value);
}

function isPhone(value) {
  return typeof value === "string" && /^[0-9]{10,15}$/.test(value);
}

function normalizeBody(body) {
  if (!body) return {};
  const normalized = { ...body };

  for (const key in normalized) {
    const value = normalized[key];

    // Convert boolean-like strings from multipart/form-data
    if (value === "true") {
      normalized[key] = true;
    } else if (value === "false") {
      normalized[key] = false;
    }

    // Parse JSON strings for arrays and objects from multipart/form-data
    else if (typeof value === "string") {
      const trimmed = value.trim();
      if (
        (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
        (trimmed.startsWith("{") && trimmed.endsWith("}"))
      ) {
        try {
          normalized[key] = JSON.parse(trimmed);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
    }
  }
  return normalized;
}

function getUserModel(connection) {
  return (
    connection.models.User ||
    connection.model("User", userSchema, "users")
  );
}

async function create_user_service({ body, file, user, tenantId }) {
  if (!tenantId) return { statusCode: 400, success: false, message: "tenant_id is required" };
  const tenantConnection = await getTenantConnection(tenantId);
  const User = getUserModel(tenantConnection);
  const normalizedBody = normalizeBody(body);
  const {
    user_first_name,
    user_last_name,
    user_phone,
    user_email,
    user_password,
    user_language,
    user_is_account_admin,
    user_enable_export_notification,
    user_send_welcome_mail,
    user_login_id,
    user_status,
    user_all_modules_access,
    user_visible_policies,
    user_visible_qa,
    user_visible_accessibility,
    user_visible_seo,
    user_visible_heartbeat,
    user_visible_inventory,
    user_visible_statistics,
    user_visible_prioritized_content,
    user_visible_performance,
    user_domains,
    user_other_info,
    user_expiry_at,
  } = normalizedBody;

  if (!user_first_name || !user_phone || !user_email || !user_password) {
    return {
      statusCode: 400,
      success: false,
      message: "Required fields: user_first_name, user_phone, user_email, user_password",
    };
  }

  const normalizedEmail = typeof user_email === "string" ? user_email.toLowerCase().trim() : user_email;

  const existingEmail = await User.findOne({
    user_email: normalizedEmail,
    user_is_deleted: false,
  });
  if (existingEmail) {
    return {
      statusCode: 409,
      success: false,
      message: "User email already exists",
    };
  }

  const existingPhone = user_phone ? await User.findOne({
    user_phone: user_phone,
    user_is_deleted: false,
  }) : null;
  if (existingPhone) {
    return {
      statusCode: 409,
      success: false,
      message: "User phone number already exists",
    };
  }

  const normalizedLoginId = typeof user_login_id === "string" ? user_login_id.trim() : "";
  if (normalizedLoginId) {
    const existingLoginId = await User.findOne({
      user_login_id: normalizedLoginId,
      user_is_deleted: false,
    });
    if (existingLoginId) {
      return {
        statusCode: 409,
        success: false,
        message: "User login id already exists",
      };
    }
  }

  const hashedPassword = await bcrypt.hash(user_password, 10);

  const userDoc = new User({
    user_first_name,
    user_last_name,
    user_phone,
    user_email: normalizedEmail,
    user_login_id: normalizedLoginId,
    user_password: hashedPassword,
    user_language: user_language || "en",
    user_is_account_admin: user_is_account_admin || false,
    user_enable_export_notification: user_enable_export_notification || false,
    user_send_welcome_mail: user_send_welcome_mail !== undefined ? user_send_welcome_mail : true,
    user_status: user_status || "active",
    user_all_modules_access: user_all_modules_access !== undefined ? user_all_modules_access : true,
    user_visible_policies: user_visible_policies !== undefined ? user_visible_policies : true,
    user_visible_qa: user_visible_qa !== undefined ? user_visible_qa : true,
    user_visible_accessibility: user_visible_accessibility !== undefined ? user_visible_accessibility : true,
    user_visible_seo: user_visible_seo !== undefined ? user_visible_seo : true,
    user_visible_heartbeat: user_visible_heartbeat !== undefined ? user_visible_heartbeat : true,
    user_visible_inventory: user_visible_inventory !== undefined ? user_visible_inventory : true,
    user_visible_statistics: user_visible_statistics !== undefined ? user_visible_statistics : true,
    user_visible_prioritized_content: user_visible_prioritized_content !== undefined ? user_visible_prioritized_content : true,
    user_visible_performance: user_visible_performance !== undefined ? user_visible_performance : true,
    user_domains: user_domains || [],
    user_other_info: user_other_info || {},
    user_expiry_at: user_expiry_at || null,
    user_created_by: user?.user_id || null,
  });



  const saved = await userDoc.save();

  return {
    statusCode: 201,
    success: true,
    message: "User created successfully",
    data: {
      user_id: saved.user_id,
      user_first_name: saved.user_first_name,
      user_last_name: saved.user_last_name,
      user_email: saved.user_email,
      user_phone: saved.user_phone,
      user_is_account_admin: saved.user_is_account_admin,
      user_status: saved.user_status,
    },
  };
}

async function get_user_by_id_service({ params, tenantId }) {
  if (!tenantId) return { statusCode: 400, success: false, message: "tenant_id is required" };
  const tenantConnection = await getTenantConnection(tenantId);
  const User = getUserModel(tenantConnection);
  const { user_id } = params;

  const user = await User.findOne({
    user_id: Number(user_id),
    user_is_deleted: false,
  }).select("-user_password -user_otp -user_otp_expiry").lean();

  if (!user) {
    return {
      statusCode: 404,
      success: false,
      message: "User not found",
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: "User retrieved successfully",
    data: user,
  };
}

async function get_user_list_service({ query, tenantId }) {
  if (!tenantId) return { statusCode: 400, success: false, message: "tenant_id is required" };
  const tenantConnection = await getTenantConnection(tenantId);
  const User = getUserModel(tenantConnection);

  const { page = 1, limit = 10, user_status, user_is_account_admin, search, is_archived } = query;
  const skip = (page - 1) * limit;

  const filter = {
    user_is_deleted: false,
    user_is_archived: is_archived === "true",
  };
  if (user_status) filter.user_status = user_status;
  if (user_is_account_admin !== undefined) filter.user_is_account_admin = user_is_account_admin;
  if (search) {
    filter.$or = [
      { user_first_name: { $regex: search, $options: "i" } },
      { user_last_name: { $regex: search, $options: "i" } },
      { user_email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("user_id user_first_name user_last_name user_email user_phone user_is_account_admin user_status user_last_login")
      .sort({ user_created_at: -1 })
      .limit(limit)
      .skip(skip)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    statusCode: 200,
    success: true,
    message: "Users retrieved successfully",
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  };
}

async function update_user_service({ params, body, file, user, tenantId }) {
  if (!tenantId) return { statusCode: 400, success: false, message: "tenant_id is required" };
  const tenantConnection = await getTenantConnection(tenantId);
  const User = getUserModel(tenantConnection);
  const { user_id } = params;

  const update = {};
  const normalizedBody = normalizeBody(body);
  const {
    user_first_name,
    user_last_name,
    user_phone,
    user_email,
    user_password,
    user_login_id,
    user_language,
    user_is_account_admin,
    user_enable_export_notification,
    user_send_welcome_mail,
    user_status,
    user_all_modules_access,
    user_visible_policies,
    user_visible_qa,
    user_visible_accessibility,
    user_visible_seo,
    user_visible_heartbeat,
    user_visible_inventory,
    user_visible_statistics,
    user_visible_prioritized_content,
    user_visible_performance,
    user_domains,
    user_other_info,
    user_expiry_at,
  } = normalizedBody;

  if (user_first_name != null) update.user_first_name = user_first_name;
  if (user_last_name != null) update.user_last_name = user_last_name;

  if (user_email != null) {
    const normalizedEmail = user_email.toLowerCase().trim();
    const existingEmail = await User.findOne({
      user_email: normalizedEmail,
      user_id: { $ne: Number(user_id) },
      user_is_deleted: false,
    });
    if (existingEmail) {
      return {
        statusCode: 409,
        success: false,
        message: "User email already exists",
      };
    }
    update.user_email = normalizedEmail;
  }

  if (user_phone != null) {
    const existingPhone = await User.findOne({
      user_phone: user_phone,
      user_id: { $ne: Number(user_id) },
      user_is_deleted: false,
    });
    if (existingPhone) {
      return {
        statusCode: 409,
        success: false,
        message: "User phone number already exists",
      };
    }
    update.user_phone = user_phone;
  }

  if (user_login_id != null) {
    const normalizedLoginId = user_login_id.trim();
    if (normalizedLoginId) {
      const existingLoginId = await User.findOne({
        user_login_id: normalizedLoginId,
        user_id: { $ne: Number(user_id) },
        user_is_deleted: false,
      });
      if (existingLoginId) {
        return {
          statusCode: 409,
          success: false,
          message: "User login id already exists",
        };
      }
      update.user_login_id = normalizedLoginId;
    }
  }

  if (user_language != null) update.user_language = user_language;
  if (user_is_account_admin != null) update.user_is_account_admin = user_is_account_admin;
  if (user_enable_export_notification != null) update.user_enable_export_notification = user_enable_export_notification;
  if (user_send_welcome_mail != null) update.user_send_welcome_mail = user_send_welcome_mail;
  if (user_status != null) update.user_status = user_status;

  if (user_all_modules_access != null) update.user_all_modules_access = user_all_modules_access;
  if (user_visible_policies != null) update.user_visible_policies = user_visible_policies;
  if (user_visible_qa != null) update.user_visible_qa = user_visible_qa;
  if (user_visible_accessibility != null) update.user_visible_accessibility = user_visible_accessibility;
  if (user_visible_seo != null) update.user_visible_seo = user_visible_seo;
  if (user_visible_heartbeat != null) update.user_visible_heartbeat = user_visible_heartbeat;
  if (user_visible_inventory != null) update.user_visible_inventory = user_visible_inventory;
  if (user_visible_statistics != null) update.user_visible_statistics = user_visible_statistics;
  if (user_visible_prioritized_content != null) update.user_visible_prioritized_content = user_visible_prioritized_content;
  if (user_visible_performance != null) update.user_visible_performance = user_visible_performance;

  if (user_domains != null) update.user_domains = user_domains;
  if (user_other_info != null) update.user_other_info = user_other_info;
  if (user_expiry_at != null) update.user_expiry_at = user_expiry_at;

  if (user_password != null) {
    update.user_password = await bcrypt.hash(user_password, 10);
  }



  update.user_updated_at = new Date();
  update.user_updated_by = user?.user_id || null;

  const updatedUser = await User.findOneAndUpdate(
    { user_id: Number(user_id), user_is_deleted: false },
    { $set: update },
    { new: true }
  );

  if (!updatedUser) {
    return {
      statusCode: 404,
      success: false,
      message: "User not found",
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: "User updated successfully",
    data: {
      user_id: updatedUser.user_id,
      user_first_name: updatedUser.user_first_name,
      user_last_name: updatedUser.user_last_name,
      user_email: updatedUser.user_email,
      user_phone: updatedUser.user_phone,
      user_is_account_admin: updatedUser.user_is_account_admin,
      user_status: updatedUser.user_status,
    },
  };
}

async function delete_user_service({ params, user, tenantId }) {
  if (!tenantId) return { statusCode: 400, success: false, message: "tenant_id is required" };
  const tenantConnection = await getTenantConnection(tenantId);
  const User = getUserModel(tenantConnection);
  const { user_id } = params;

  const updatedUser = await User.findOneAndUpdate(
    { user_id: Number(user_id), user_is_deleted: false },
    {
      $set: {
        user_is_deleted: true,
        user_deleted_at: new Date(),
        user_deleted_by: user?.user_id || null,
      },
    },
    { new: true }
  );

  if (!updatedUser) {
    return {
      statusCode: 404,
      success: false,
      message: "User not found",
    };
  }



  return {
    statusCode: 200,
    success: true,
    message: "User deleted successfully",
  };
}

async function bulk_create_users_service({ body, user, tenantId }) {
  if (!tenantId) return { statusCode: 400, success: false, message: "tenant_id is required" };
  const tenantConnection = await getTenantConnection(tenantId);
  const User = getUserModel(tenantConnection);

  const { users: userArray } = body || { users: [] };

  if (!Array.isArray(userArray) || userArray.length === 0) {
    return {
      statusCode: 400,
      success: false,
      message: "body.users must be a non-empty array",
    };
  }

  if (userArray.length > 1000) {  // Reasonable limit to prevent abuse
    return {
      statusCode: 400,
      success: false,
      message: "Maximum 1000 users per bulk request",
    };
  }

  const requiredFields = ['user_first_name', 'user_phone', 'user_email', 'user_password'];
  const failures = [];
  const validDocs = [];
  const emailsToCheck = new Set();
  const phonesToCheck = new Set();
  const loginIdsToCheck = new Set();

  // First pass: basic validation + collect for DB checks
  for (let i = 0; i < userArray.length; i++) {
    const u = userArray[i];
    const errors = [];

    for (const field of requiredFields) {
      if (!u[field]) {
        errors.push(`${field} is required`);
      }
    }

    const normalizedEmail = u.user_email?.toLowerCase?.().trim();
    if (normalizedEmail && !isEmail(normalizedEmail)) {
      errors.push('Invalid user_email format');
    }

    const phone = u.user_phone;
    if (phone && !isPhone(phone)) {
      errors.push('Invalid user_phone format');
    }

    if (errors.length > 0) {
      failures.push({ index: i, email: normalizedEmail || 'unknown', errors });
      continue;
    }

    // Check internal duplicates
    if (emailsToCheck.has(normalizedEmail)) {
      failures.push({ index: i, email: normalizedEmail, errors: ['Duplicate email in request'] });
      continue;
    }
    emailsToCheck.add(normalizedEmail);

    if (phone && phonesToCheck.has(phone)) {
      failures.push({ index: i, email: normalizedEmail, errors: ['Duplicate phone in request'] });
      continue;
    }
    if (phone) phonesToCheck.add(phone);

    const loginId = u.user_login_id?.trim();
    if (loginId) {
      if (loginIdsToCheck.has(loginId)) {
        failures.push({ index: i, email: normalizedEmail, errors: ['Duplicate login_id in request'] });
        continue;
      }
      loginIdsToCheck.add(loginId);
    }

    validDocs.push({ ...u, user_email: normalizedEmail, user_login_id: loginId || '', __index: i });  // Temp for tracking
  }

  if (validDocs.length === 0) {
    return {
      statusCode: 400,
      success: false,
      message: "No valid users to create",
      failures,
    };
  }

  // DB duplicate checks for remaining valid
  const dbChecks = await Promise.allSettled([
    User.countDocuments({ user_email: { $in: Array.from(emailsToCheck) }, user_is_deleted: false }).then(c => ({ type: 'email', count: c })),
    ...Array.from(phonesToCheck).map(p => User.countDocuments({ user_phone: p, user_is_deleted: false }).then(c => ({ phone: p, count: c }))),
    ...Array.from(loginIdsToCheck).map(l => User.countDocuments({ user_login_id: l, user_is_deleted: false }).then(c => ({ login_id: l, count: c }))),
  ]);

  // Filter out DB duplicates
  const docsToInsert = [];
  for (const doc of validDocs) {
    const email = doc.user_email;
    // Simplified: if any count >0 for this, skip (detailed check can be enhanced)
    if (dbChecks.some(check =>
    (check.status === 'fulfilled' && (
      (check.value.type === 'email' && check.value.count > emailsToCheck.size - 1) ||  // Rough
      check.value.phone === doc.user_phone ||
      check.value.login_id === doc.user_login_id
    ))
    )) {
      failures.push({ index: doc.__index, email, errors: ['Already exists in database (email/phone/login_id)'] });
      continue;
    }
    delete doc.__index;
    docsToInsert.push(doc);
  }

  if (docsToInsert.length === 0) {
    return {
      statusCode: 409,
      success: false,
      message: "No users to create (all have duplicates)",
      failures,
    };
  }

  // Hash all passwords
  const hashedPromises = docsToInsert.map(async (doc) => {
    doc.user_password = await bcrypt.hash(doc.user_password, 10);
    doc.user_status = 'active';
    doc.user_created_by = user?.user_id || null;
    return doc;
  });

  const hashedDocs = await Promise.all(hashedPromises);

  // Bulk insert
  const insertedUsers = await User.insertMany(hashedDocs, { ordered: false });

  // Successes
  const successes = insertedUsers.map(u => ({
    user_id: u.user_id,
    user_first_name: u.user_first_name,
    user_last_name: u.user_last_name,
    user_email: u.user_email,
    user_phone: u.user_phone,
  }));

  return {
    statusCode: 201,
    success: true,
    message: `${successes.length} users created successfully`,
    data: {
      successes,
      failures,
      total: successes.length + failures.length,
    },
  };
}



async function user_login_by_email({ tenantConnection, email, password }) {
  const User = getUserModel(tenantConnection);

  const user = await User.findOne({
    user_email: email,
    user_is_deleted: false,
  });

  if (!user) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  const isMatch = await bcrypt.compare(password, user.user_password);
  if (!isMatch) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  user.user_last_login = new Date();
  await user.save();

  const payload = {
    user_id: user.user_id,
    user_email: user.user_email,
  };

  const access_token = get_access_token(payload);
  const refresh_token = get_refresh_token(payload);

  return {
    statusCode: 200,
    success: true,
    message: "Login successfully.",
    data: {
      access_token,
      refresh_token,
      user: {
        user_id: user.user_id,
        user_first_name: user.user_first_name,
        user_last_name: user.user_last_name,
        user_email: user.user_email,
        user_phone: user.user_phone,
      },
    },
  };
}

async function user_login_by_phone({ tenantConnection, phone, password }) {
  const User = getUserModel(tenantConnection);

  const user = await User.findOne({
    user_phone: phone,
    user_is_deleted: false,
  });

  if (!user) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  const isMatch = await bcrypt.compare(password, user.user_password);
  if (!isMatch) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  user.user_last_login = new Date();
  await user.save();

  const payload = {
    user_id: user.user_id,
    user_email: user.user_email,
  };

  const access_token = get_access_token(payload);
  const refresh_token = get_refresh_token(payload);

  return {
    statusCode: 200,
    success: true,
    message: "Login successful",
    data: {
      access_token,
      refresh_token,
      user: {
        user_id: user.user_id,
        user_first_name: user.user_first_name,
        user_last_name: user.user_last_name,
        user_email: user.user_email,
        user_phone: user.user_phone,
      },
    },
  };
}

async function user_login_by_id({ tenantConnection, login_id, password }) {
  const User = getUserModel(tenantConnection);

  const user = await User.findOne({
    user_login_id: login_id,
    user_is_deleted: false,
  });

  if (!user) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  const isMatch = await bcrypt.compare(password, user.user_password);
  if (!isMatch) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  user.user_last_login = new Date();
  await user.save();

  const payload = {
    user_id: user.user_id,
    user_email: user.user_email,
  };

  const access_token = get_access_token(payload);
  const refresh_token = get_refresh_token(payload);

  return {
    statusCode: 200,
    success: true,
    message: "Login successful",
    data: {
      access_token,
      refresh_token,
      user: {
        user_id: user.user_id,
        user_first_name: user.user_first_name,
        user_last_name: user.user_last_name,
        user_email: user.user_email,
        user_phone: user.user_phone,
      },
    },
  };
}

async function login_user_service({ body, tenantId }) {
  if (!tenantId) {
    return {
      statusCode: 400,
      success: false,
      message: "tenant_id is required",
    };
  }
  const tenantConnection = await getTenantConnection(tenantId);
  const { login_id, login_password, user_email, user_password } = body || {};

  const id = login_id || user_email;
  const password = login_password || user_password;

  if (!id || !password) {
    return {
      statusCode: 400,
      success: false,
      message: "login_id and login_password are required",
    };
  }

  if (isEmail(id)) {
    return user_login_by_email({
      tenantConnection,
      email: id,
      password,
    });
  }

  if (isPhone(id)) {
    return user_login_by_phone({
      tenantConnection,
      phone: id,
      password,
    });
  }

  return user_login_by_id({
    tenantConnection,
    login_id: id,
    password,
  });
}

async function archive_user_service({ params, tenantId }) {
  if (!tenantId) return { statusCode: 400, success: false, message: "tenant_id is required" };
  const tenantConnection = await getTenantConnection(tenantId);
  const User = getUserModel(tenantConnection);
  const { user_id } = params;

  const updatedUser = await User.findOneAndUpdate(
    { user_id: Number(user_id), user_is_deleted: false },
    { $set: { user_is_archived: true } },
    { new: true }
  );

  if (!updatedUser) {
    return { statusCode: 404, success: false, message: "User not found" };
  }

  return { statusCode: 200, success: true, message: "User archived successfully" };
}

async function restore_user_service({ params, tenantId }) {
  if (!tenantId) return { statusCode: 400, success: false, message: "tenant_id is required" };
  const tenantConnection = await getTenantConnection(tenantId);
  const User = getUserModel(tenantConnection);
  const { user_id } = params;

  const updatedUser = await User.findOneAndUpdate(
    { user_id: Number(user_id), user_is_deleted: false },
    { $set: { user_is_archived: false } },
    { new: true }
  );

  if (!updatedUser) {
    return { statusCode: 404, success: false, message: "User not found" };
  }

  return { statusCode: 200, success: true, message: "User restored successfully" };
}

async function hard_delete_user_service({ params, tenantId }) {
  if (!tenantId) return { statusCode: 400, success: false, message: "tenant_id is required" };
  const tenantConnection = await getTenantConnection(tenantId);
  const User = getUserModel(tenantConnection);
  const { user_id } = params;

  const deletedUser = await User.findOneAndDelete({ user_id: Number(user_id) });

  if (!deletedUser) {
    return { statusCode: 404, success: false, message: "User not found" };
  }

  return { statusCode: 200, success: true, message: "User permanently deleted" };
}

module.exports = {
  create_user_service,
  get_user_by_id_service,
  get_user_list_service,
  update_user_service,
  delete_user_service,
  bulk_create_users_service,
  login_user_service,
  archive_user_service,
  restore_user_service,
  hard_delete_user_service,
};
