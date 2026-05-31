const bcrypt = require("bcrypt");
const { superAdminSchema } = require("../models/super_admin.schema");
const {
  get_access_token,
  get_refresh_token,
  verify_jwt_token,
} = require("../../../common/services/jwt.service");

function isEmail(value) {
  return typeof value === "string" && /\S+@\S+\.\S+/.test(value);
}

function isPhone(value) {
  return typeof value === "string" && /^\d{7,15}$/.test(value);
}

function getSuperAdminModel(connection) {
  return (
    connection.models.SuperAdmin ||
    connection.model("SuperAdmin", superAdminSchema, "super_admins")
  );
}

async function create_super_admin_service({ masterConnection, body, user }) {
  const SuperAdmin = getSuperAdminModel(masterConnection);

  const {
    sa_first_name,
    sa_father_name,
    sa_last_name,
    sa_email,
    sa_phone,
    sa_password,
    sa_login_id,
  } = body || {};

  const existingEmail = await SuperAdmin.findOne({
    sa_email,
    sa_is_deleted: false,
  });
  if (existingEmail) {
    return {
      statusCode: 409,
      success: false,
      message: "Super admin email already exists",
    };
  }

  const existingPhone = await SuperAdmin.findOne({
    sa_phone,
    sa_is_deleted: false,
  });
  if (existingPhone) {
    return {
      statusCode: 409,
      success: false,
      message: "Super admin phone already exists",
    };
  }

  const hashedPassword = await bcrypt.hash(sa_password, 10);

  const sa = new SuperAdmin({
    sa_first_name,
    sa_father_name,
    sa_last_name,
    sa_email,
    sa_phone,
    sa_login_id,
    sa_password: hashedPassword,
    sa_created_by: user?.sa_id || user?.admin_id || null,
  });

  const saved = await sa.save();

  return {
    statusCode: 201,
    success: true,
    message: "Super admin created successfully",
    data: {
      sa_id: saved.sa_id,
      sa_first_name: saved.sa_first_name,
      sa_father_name: saved.sa_father_name,
      sa_last_name: saved.sa_last_name,
      sa_email: saved.sa_email,
      sa_phone: saved.sa_phone,
      sa_login_id: saved.sa_login_id,
    },
  };
}

async function update_super_admin_service({ masterConnection, params, body, user }) {
  const SuperAdmin = getSuperAdminModel(masterConnection);
  const { sa_id } = params;

  const update = {};
  const {
    sa_first_name,
    sa_father_name,
    sa_last_name,
    sa_email,
    sa_phone,
    sa_password,
    sa_login_id,
  } = body || {};

  if (sa_first_name != null) update.sa_first_name = sa_first_name;
  if (sa_father_name != null) update.sa_father_name = sa_father_name;
  if (sa_last_name != null) update.sa_last_name = sa_last_name;
  if (sa_email != null) update.sa_email = sa_email;
  if (sa_phone != null) update.sa_phone = sa_phone;
  if (sa_login_id != null) update.sa_login_id = sa_login_id;
  if (sa_password != null) {
    update.sa_password = await bcrypt.hash(sa_password, 10);
  }

  update.sa_updated_at = new Date();
  update.sa_updated_by = user?.sa_id || user?.admin_id || null;

  const sa = await SuperAdmin.findOneAndUpdate(
    { sa_id: Number(sa_id), sa_is_deleted: false },
    { $set: update },
    { new: true }
  );

  if (!sa) {
    return {
      statusCode: 404,
      success: false,
      message: "Super admin not found",
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: "Super admin updated successfully",
    data: {
      sa_id: sa.sa_id,
      sa_first_name: sa.sa_first_name,
      sa_father_name: sa.sa_father_name,
      sa_last_name: sa.sa_last_name,
      sa_email: sa.sa_email,
      sa_phone: sa.sa_phone,
    },
  };
}

async function delete_super_admin_service({ masterConnection, params, user }) {
  const SuperAdmin = getSuperAdminModel(masterConnection);
  const { sa_id } = params;

  const sa = await SuperAdmin.findOneAndUpdate(
    { sa_id: Number(sa_id), sa_is_deleted: false },
    {
      $set: {
        sa_is_deleted: true,
        sa_deleted_at: new Date(),
        sa_deleted_by: user?.sa_id || user?.admin_id || null,
      },
    },
    { new: true }
  );

  if (!sa) {
    return {
      statusCode: 404,
      success: false,
      message: "Super admin not found",
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: "Super admin deleted successfully",
  };
}

async function super_admin_login_by_email({ masterConnection, email, password }) {
  const SuperAdmin = getSuperAdminModel(masterConnection);

  const sa = await SuperAdmin.findOne({
    sa_email: email,
    sa_is_deleted: false,
  });

  if (!sa) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  const isMatch = await bcrypt.compare(password, sa.sa_password);
  if (!isMatch) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  sa.sa_last_login = new Date();
  await sa.save();

  const payload = {
    sa_id: sa.sa_id,
    sa_email: sa.sa_email,
    tenant_id: "super",
    role: "super_admin",
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
      super_admin: {
        sa_id: sa.sa_id,
        sa_first_name: sa.sa_first_name,
        sa_father_name: sa.sa_father_name,
        sa_last_name: sa.sa_last_name,
        sa_email: sa.sa_email,
        sa_phone: sa.sa_phone,
      },
    },
  };
}

async function super_admin_login_by_phone({ masterConnection, phone, password }) {
  const SuperAdmin = getSuperAdminModel(masterConnection);

  const sa = await SuperAdmin.findOne({
    sa_phone: phone,
    sa_is_deleted: false,
  });

  if (!sa) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  const isMatch = await bcrypt.compare(password, sa.sa_password);
  if (!isMatch) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  sa.sa_last_login = new Date();
  await sa.save();

  const payload = {
    sa_id: sa.sa_id,
    sa_email: sa.sa_email,
    tenant_id: "super",
    role: "super_admin",
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
      super_admin: {
        sa_id: sa.sa_id,
        sa_first_name: sa.sa_first_name,
        sa_father_name: sa.sa_father_name,
        sa_last_name: sa.sa_last_name,
        sa_email: sa.sa_email,
        sa_phone: sa.sa_phone,
      },
    },
  };
}

async function super_admin_login_by_id({ masterConnection, login_id, password }) {
  const SuperAdmin = getSuperAdminModel(masterConnection);

  const sa = await SuperAdmin.findOne({
    sa_login_id: login_id,
    sa_is_deleted: false,
  });

  if (!sa) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  const isMatch = await bcrypt.compare(password, sa.sa_password);
  if (!isMatch) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  sa.sa_last_login = new Date();
  await sa.save();

  const payload = {
    sa_id: sa.sa_id,
    sa_email: sa.sa_email,
    tenant_id: "super",
    role: "super_admin",
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
      super_admin: {
        sa_id: sa.sa_id,
        sa_first_name: sa.sa_first_name,
        sa_father_name: sa.sa_father_name,
        sa_last_name: sa.sa_last_name,
        sa_email: sa.sa_email,
        sa_phone: sa.sa_phone,
      },
    },
  };
}

async function login_super_admin_service({ masterConnection, body }) {
  const { login_id, login_password, sa_email, sa_password } = body || {};

  const id = login_id || sa_email;
  const password = login_password || sa_password;

  if (!id || !password) {
    return {
      statusCode: 400,
      success: false,
      message: "login_id and login_password are required",
    };
  }

  if (isEmail(id)) {
    return super_admin_login_by_email({
      masterConnection,
      email: id,
      password,
    });
  }

  if (isPhone(id)) {
    return super_admin_login_by_phone({
      masterConnection,
      phone: id,
      password,
    });
  }

  return super_admin_login_by_id({
    masterConnection,
    login_id: id,
    password,
  });
}

async function refresh_super_admin_token_service({ masterConnection, token }) {
  const SuperAdmin = getSuperAdminModel(masterConnection);

  try {
    const decoded = verify_jwt_token(token);

    if (decoded && decoded.token_type && decoded.token_type !== "refresh") {
      return {
        statusCode: 400,
        success: false,
        message: "Provided token is not a refresh token",
      };
    }

    const sa = await SuperAdmin.findOne({
      sa_id: decoded.sa_id,
      sa_is_deleted: false,
    });

    if (!sa) {
      return {
        statusCode: 404,
        success: false,
        message: "Super admin not found",
      };
    }

    const payload = {
      sa_id: sa.sa_id,
      sa_email: sa.sa_email,
      tenant_id: "super",
      role: "super_admin",
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

module.exports = {
  create_super_admin_service,
  update_super_admin_service,
  delete_super_admin_service,
  login_super_admin_service,
  super_admin_login_by_email,
  super_admin_login_by_phone,
  super_admin_login_by_id,
  refresh_super_admin_token_service,
};

