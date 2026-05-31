const bcrypt = require("bcrypt");
const { adminSchema } = require("../models/admin.schema");
const { tenantSchema } = require("../../tenant/models/tenant.schema");
const { createTenantConnection } = require("../../../config/mongooseTenant");
const {
  get_access_token,
  get_refresh_token,
  verify_jwt_token,
} = require("../../../common/services/jwt.service");
const imageService = require("../../../common/services/image.service");

function isEmail(value) {
  return typeof value === "string" && /\S+@\S+\.\S+/.test(value);
}

function isPhone(value) {
  return typeof value === "string" && /^\d{7,15}$/.test(value);
}

function getAdminModel(connection) {
  return (
    connection.models.Admin ||
    connection.model("Admin", adminSchema, "admins")
  );
}

function getTenantModel(connection) {
  return (
    connection.models.Tenant ||
    connection.model("Tenant", tenantSchema, "tenants")
  );
}

/**
 * Create a new tenant (and its DB) and the first admin for that tenant.
 * Used when super admin creates a new tenant + admin in one request.
 * - tenant_name unique check
 * - DB name format: tenant_<tenant_name> (normalized, e.g. tenant_abccompany)
 * - Inserts tenant in master DB, then admin in tenant DB with admin_tent_id
 */
async function create_tenant_and_admin_service({ masterConnection, body, file }) {
  const {
    tenant_name,
    tenant_domain,
    admin_first_name,
    admin_father_name,
    admin_last_name,
    admin_email,
    admin_phone,
    admin_password,
    admin_login_id,
  } = body || {};

  if (!tenant_name || !tenant_domain) {
    return {
      statusCode: 400,
      success: false,
      message: "tenant_name and tenant_domain are required",
    };
  }

  if (
    !admin_first_name ||
    !admin_father_name ||
    !admin_last_name ||
    !admin_email ||
    !admin_phone ||
    !admin_password
  ) {
    return {
      statusCode: 400,
      success: false,
      message:
        "Admin fields required: admin_first_name, admin_father_name, admin_last_name, admin_email, admin_phone, admin_password",
    };
  }

  const normalizedTenantName = tenant_name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

  if (!normalizedTenantName) {
    return {
      statusCode: 400,
      success: false,
      message: "tenant_name cannot be empty",
    };
  }

  const Tenant = getTenantModel(masterConnection);
  const existingTenant = await Tenant.findOne({
    tent_name: normalizedTenantName,
  });

  if (existingTenant) {
    return {
      statusCode: 409,
      success: false,
      message: "Tenant name already exists",
    };
  }

  const dbName = `tenant_${normalizedTenantName}`;
  let tenantConnection;

  try {
    tenantConnection = await createTenantConnection(dbName);
  } catch (err) {
    return {
      statusCode: 500,
      success: false,
      message: "Failed to create tenant database",
      error: process.env.NODE_ENV === "LOCAL" ? err.message : undefined,
    };
  }

  const now = new Date();
  const tenantDoc = new Tenant({
    tent_name: normalizedTenantName,
    tent_domain: tenant_domain.trim(),
    tent_status: "active",
    tent_plan: "basic",
    tent_add_date: now,
    tent_created_at: now,
  });

  let savedTenant;
  try {
    savedTenant = await tenantDoc.save();
  } catch (err) {
    return {
      statusCode: 500,
      success: false,
      message: "Failed to save tenant",
      error: process.env.NODE_ENV === "LOCAL" ? err.message : undefined,
    };
  }

  const Admin = getAdminModel(tenantConnection);
  const existingEmail = await Admin.findOne({
    admin_email: admin_email.toLowerCase(),
    admin_is_deleted: false,
  });
  if (existingEmail) {
    return {
      statusCode: 409,
      success: false,
      message: "Admin email already exists in this tenant",
    };
  }

  const existingPhone = await Admin.findOne({
    admin_phone: admin_phone,
    admin_is_deleted: false,
  });
  if (existingPhone) {
    return {
      statusCode: 409,
      success: false,
      message: "Admin phone already exists in this tenant",
    };
  }

  const normalizedLoginId =
    typeof admin_login_id === "string" ? admin_login_id.trim() : "";
  if (normalizedLoginId) {
    const existingLoginId = await Admin.findOne({
      admin_login_id: normalizedLoginId,
      admin_is_deleted: false,
    });
    if (existingLoginId) {
      return {
        statusCode: 409,
        success: false,
        message: "Admin login id already exists in this tenant",
      };
    }
  }

  const hashedPassword = await bcrypt.hash(admin_password, 10);

  const admin = new Admin({
    admin_first_name,
    admin_father_name,
    admin_last_name,
    admin_email: admin_email.toLowerCase().trim(),
    admin_phone,
    admin_login_id: normalizedLoginId,
    admin_password: hashedPassword,
    admin_role: "admin",
    admin_status: "active",
    admin_tent_id: savedTenant.tent_id,
  });

  if (file) {
    admin.admin_profile_image = await imageService.saveImage(file, 'admins', normalizedTenantName);
  }

  let savedAdmin;
  try {
    savedAdmin = await admin.save();
  } catch (err) {
    return {
      statusCode: 500,
      success: false,
      message: "Failed to create admin",
      error: process.env.NODE_ENV === "LOCAL" ? err.message : undefined,
    };
  }

  return {
    statusCode: 201,
    success: true,
    message: "Tenant and admin created successfully",
    data: {
      tenant: {
        tent_id: savedTenant.tent_id,
        tent_name: savedTenant.tent_name,
        tent_domain: savedTenant.tent_domain,
        tent_status: savedTenant.tent_status,
        tent_plan: savedTenant.tent_plan,
        tent_add_date: savedTenant.tent_add_date,
        tent_created_at: savedTenant.tent_created_at,
      },
      admin: {
        admin_id: savedAdmin.admin_id,
        admin_first_name: savedAdmin.admin_first_name,
        admin_father_name: savedAdmin.admin_father_name,
        admin_last_name: savedAdmin.admin_last_name,
        admin_email: savedAdmin.admin_email,
        admin_phone: savedAdmin.admin_phone,
        admin_login_id: savedAdmin.admin_login_id,
        admin_role: savedAdmin.admin_role,
        admin_status: savedAdmin.admin_status,
        admin_tent_id: savedAdmin.admin_tent_id,
        admin_profile_image: savedAdmin.admin_profile_image,
      },
    },
  };
}

async function create_admin_service({ tenantConnection, body, file, user, tenantId }) {
  const Admin = getAdminModel(tenantConnection);

  const {
    admin_first_name,
    admin_father_name,
    admin_last_name,
    admin_email,
    admin_phone,
    admin_password,
    admin_login_id,
  } = body || {};

  const normalizedEmail =
    typeof admin_email === "string" ? admin_email.toLowerCase().trim() : admin_email;
  const normalizedLoginId =
    typeof admin_login_id === "string" ? admin_login_id.trim() : "";

  const existingEmail = await Admin.findOne({
    admin_email: normalizedEmail,
    admin_is_deleted: false,
  });
  if (existingEmail) {
    return {
      statusCode: 409,
      success: false,
      message: "Admin email already exists",
    };
  }

  const existingPhone = await Admin.findOne({
    admin_phone,
    admin_is_deleted: false,
  });
  if (existingPhone) {
    return {
      statusCode: 409,
      success: false,
      message: "Admin phone already exists",
    };
  }

  if (normalizedLoginId) {
    const existingLoginId = await Admin.findOne({
      admin_login_id: normalizedLoginId,
      admin_is_deleted: false,
    });
    if (existingLoginId) {
      return {
        statusCode: 409,
        success: false,
        message: "Admin login id already exists",
      };
    }
  }

  const hashedPassword = await bcrypt.hash(admin_password, 10);

  const admin = new Admin({
    admin_first_name,
    admin_father_name,
    admin_last_name,
    admin_email: normalizedEmail,
    admin_phone,
    admin_login_id: normalizedLoginId,
    admin_password: hashedPassword,
    admin_created_by: user?.admin_id || null,
  });

  if (file) {
    admin.admin_profile_image = await imageService.saveImage(file, 'admins', tenantId);
  }

  const saved = await admin.save();

  return {
    statusCode: 201,
    success: true,
    message: "Admin created successfully",
    data: {
      admin_id: saved.admin_id,
      admin_first_name: saved.admin_first_name,
      admin_father_name: saved.admin_father_name,
      admin_last_name: saved.admin_last_name,
      admin_email: saved.admin_email,
      admin_phone: saved.admin_phone,
      admin_login_id: saved.admin_login_id,
      admin_profile_image: saved.admin_profile_image,
    },
  };
}

async function update_admin_service({ tenantConnection, params, body, file, user, tenantId }) {
  const Admin = getAdminModel(tenantConnection);
  const { admin_id } = params;

  const update = {};
  const {
    admin_first_name,
    admin_father_name,
    admin_last_name,
    admin_email,
    admin_phone,
    admin_password,
    admin_login_id,
  } = body || {};

  if (admin_first_name != null) update.admin_first_name = admin_first_name;
  if (admin_father_name != null) update.admin_father_name = admin_father_name;
  if (admin_last_name != null) update.admin_last_name = admin_last_name;
  if (admin_email != null) update.admin_email = admin_email;
  if (admin_phone != null) update.admin_phone = admin_phone;
  if (admin_login_id != null) update.admin_login_id = admin_login_id;
  if (admin_password != null) {
    update.admin_password = await bcrypt.hash(admin_password, 10);
  }

  if (file) {
    update.admin_profile_image = await imageService.saveImage(file, 'admins', tenantId);
  }

  update.admin_updated_at = new Date();
  update.admin_updated_by = user?.admin_id || null;

  const admin = await Admin.findOneAndUpdate(
    { admin_id: Number(admin_id), admin_is_deleted: false },
    { $set: update },
    { new: true }
  );

  if (!admin) {
    return {
      statusCode: 404,
      success: false,
      message: "Admin not found",
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: "Admin updated successfully",
    data: {
      admin_id: admin.admin_id,
      admin_first_name: admin.admin_first_name,
      admin_father_name: admin.admin_father_name,
      admin_last_name: admin.admin_last_name,
      admin_email: admin.admin_email,
      admin_phone: admin.admin_phone,
      admin_profile_image: admin.admin_profile_image,
    },
  };
}

async function delete_admin_service({ tenantConnection, params, user }) {
  const Admin = getAdminModel(tenantConnection);
  const { admin_id } = params;

  const admin = await Admin.findOneAndUpdate(
    { admin_id: Number(admin_id), admin_is_deleted: false },
    {
      $set: {
        admin_is_deleted: true,
        admin_deleted_at: new Date(),
        admin_deleted_by: user?.admin_id || null,
      },
    },
    { new: true }
  );

  if (!admin) {
    return {
      statusCode: 404,
      success: false,
      message: "Admin not found",
    };
  }

  // Delete associated profile image file if it exists
  if (admin.admin_profile_image && admin.admin_profile_image.file_path) {
    await imageService.deleteImage(admin.admin_profile_image.file_path);
  }

  return {
    statusCode: 200,
    success: true,
    message: "Admin deleted successfully",
  };
}

async function admin_login_by_email({ tenantConnection, email, password, tenantId }) {
  const Admin = getAdminModel(tenantConnection);

  const admin = await Admin.findOne({
    admin_email: email,
    admin_is_deleted: false,
  });

  if (!admin) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  const isMatch = await bcrypt.compare(password, admin.admin_password);
  if (!isMatch) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  admin.admin_last_login = new Date();
  await admin.save();

  const payload = {
    admin_id: admin.admin_id,
    admin_email: admin.admin_email,
    tenant_id: tenantId,
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
      admin: {
        admin_id: admin.admin_id,
        admin_first_name: admin.admin_first_name,
        admin_father_name: admin.admin_father_name,
        admin_last_name: admin.admin_last_name,
        admin_email: admin.admin_email,
        admin_phone: admin.admin_phone,
        admin_profile_image: admin.admin_profile_image,
      },
    },
  };
}

async function admin_login_by_phone({ tenantConnection, phone, password, tenantId }) {
  const Admin = getAdminModel(tenantConnection);

  const admin = await Admin.findOne({
    admin_phone: phone,
    admin_is_deleted: false,
  });

  if (!admin) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  const isMatch = await bcrypt.compare(password, admin.admin_password);
  if (!isMatch) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  admin.admin_last_login = new Date();
  await admin.save();

  const payload = {
    admin_id: admin.admin_id,
    admin_email: admin.admin_email,
    tenant_id: tenantId,
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
      admin: {
        admin_id: admin.admin_id,
        admin_first_name: admin.admin_first_name,
        admin_father_name: admin.admin_father_name,
        admin_last_name: admin.admin_last_name,
        admin_email: admin.admin_email,
        admin_phone: admin.admin_phone,
        admin_profile_image: admin.admin_profile_image,
      },
    },
  };
}

async function admin_login_by_id({ tenantConnection, login_id, password, tenantId }) {
  const Admin = getAdminModel(tenantConnection);

  const admin = await Admin.findOne({
    admin_login_id: login_id,
    admin_is_deleted: false,
  });

  if (!admin) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  const isMatch = await bcrypt.compare(password, admin.admin_password);
  if (!isMatch) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  admin.admin_last_login = new Date();
  await admin.save();

  const payload = {
    admin_id: admin.admin_id,
    admin_email: admin.admin_email,
    tenant_id: tenantId,
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
      admin: {
        admin_id: admin.admin_id,
        admin_first_name: admin.admin_first_name,
        admin_father_name: admin.admin_father_name,
        admin_last_name: admin.admin_last_name,
        admin_email: admin.admin_email,
        admin_phone: admin.admin_phone,
        admin_profile_image: admin.admin_profile_image,
      },
    },
  };
}

async function login_admin_service({ tenantConnection, body, tenantId }) {
  const { login_id, login_password, admin_email, admin_password } = body || {};

  const id = login_id || admin_email;
  const password = login_password || admin_password;

  if (!id || !password) {
    return {
      statusCode: 400,
      success: false,
      message: "login_id and login_password are required",
    };
  }

  if (isEmail(id)) {
    return admin_login_by_email({
      tenantConnection,
      email: id,
      password,
      tenantId,
    });
  }

  if (isPhone(id)) {
    return admin_login_by_phone({
      tenantConnection,
      phone: id,
      password,
      tenantId,
    });
  }

  return admin_login_by_id({
    tenantConnection,
    login_id: id,
    password,
    tenantId,
  });
}

async function refresh_admin_token_service({ tenantConnection, token, tenantId }) {
  const Admin = getAdminModel(tenantConnection);

  try {
    const decoded = verify_jwt_token(token);

    if (decoded && decoded.token_type && decoded.token_type !== "refresh") {
      return {
        statusCode: 400,
        success: false,
        message: "Provided token is not a refresh token",
      };
    }

    const admin = await Admin.findOne({
      admin_id: decoded.admin_id,
      admin_is_deleted: false,
    });

    if (!admin) {
      return {
        statusCode: 404,
        success: false,
        message: "Admin not found",
      };
    }

    const payload = {
      admin_id: admin.admin_id,
      admin_email: admin.admin_email,
      tenant_id: tenantId,
    };

    const access_token = get_access_token(payload);
    const refresh_token = get_refresh_token(payload);

    return {
      statusCode: 200,
      success: true,
      message: "Token refreshed successfully",
      data: {
        access_token,
        refresh_token,
      },
    };
  } catch (err) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid or expired refresh token",
    };
  }
}

async function get_admin_list_service({ tenantConnection, query }) {
  const Admin = getAdminModel(tenantConnection);
  const { page = 1, limit = 10, admin_status, search } = query || {};
  const skip = (page - 1) * limit;

  const filter = { admin_is_deleted: false };
  if (admin_status) filter.admin_status = admin_status;

  if (search) {
    filter.$or = [
      { admin_first_name: { $regex: search, $options: "i" } },
      { admin_father_name: { $regex: search, $options: "i" } },
      { admin_last_name: { $regex: search, $options: "i" } },
      { admin_email: { $regex: search, $options: "i" } },
      { admin_phone: { $regex: search, $options: "i" } },
    ];
  }

  const [admins, total] = await Promise.all([
    Admin.find(filter)
      .select("-admin_password -admin_otp -admin_otp_expiry")
      .sort({ admin_created_at: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .lean(),
    Admin.countDocuments(filter),
  ]);

  return {
    statusCode: 200,
    success: true,
    message: "Admins retrieved successfully",
    data: {
      admins,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  };
}

async function get_admin_by_id_service({ tenantConnection, params }) {
  const Admin = getAdminModel(tenantConnection);
  const { admin_id } = params;

  const admin = await Admin.findOne({
    admin_id: Number(admin_id),
    admin_is_deleted: false,
  })
    .select("-admin_password -admin_otp -admin_otp_expiry")
    .lean();

  if (!admin) {
    return {
      statusCode: 404,
      success: false,
      message: "Admin not found",
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: "Admin retrieved successfully",
    data: admin,
  };
}

module.exports = {
  create_admin_service,
  create_tenant_and_admin_service,
  update_admin_service,
  delete_admin_service,
  login_admin_service,
  admin_login_by_email,
  admin_login_by_phone,
  admin_login_by_id,
  refresh_admin_token_service,
  get_admin_list_service,
  get_admin_by_id_service,
};

