const { tenantSchema } = require("../models/tenant.schema");

function getTenantModel(connection) {
  return (
    connection.models.Tenant ||
    connection.model("Tenant", tenantSchema, "tenants")
  );
}

/**
 * Get all tenants (non-deleted by default; optional include_deleted for super admin)
 */
async function get_all_tenants_service({ masterConnection, query }) {
  const Tenant = getTenantModel(masterConnection);
  const includeDeleted = query?.include_deleted === "true" || query?.include_deleted === true;

  const filter = includeDeleted ? {} : { tent_is_deleted: false };

  const tenants = await Tenant.find(filter)
    .sort({ tent_id: 1 })
    .lean();

  const list = tenants.map((t) => ({
    tent_id: t.tent_id,
    tent_name: t.tent_name,
    tent_domain: t.tent_domain,
    tent_expiry_date: t.tent_expiry_date,
    tent_status: t.tent_status,
    tent_plan: t.tent_plan,
    tent_add_date: t.tent_add_date,
    tent_created_at: t.tent_created_at,
    tent_updated_at: t.tent_updated_at,
    tent_deleted_at: t.tent_deleted_at,
    tent_is_deleted: t.tent_is_deleted,
  }));

  return {
    statusCode: 200,
    success: true,
    message: "Tenants fetched successfully",
    data: list,
    total: list.length,
  };
}

/**
 * Update tenant by tent_id (soft-deleted tenants are excluded)
 */
async function update_tenant_service({ masterConnection, params, body, user }) {
  const Tenant = getTenantModel(masterConnection);
  const { tent_id } = params;

  const allowed = [
    "tent_name",
    "tent_domain",
    "tent_expiry_date",
    "tent_status",
    "tent_plan",
  ];
  const update = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return {
      statusCode: 400,
      success: false,
      message: "At least one field must be provided to update",
    };
  }

  update.tent_updated_at = new Date();
  update.tent_updated_by = user?.admin_id || null;

  const tenant = await Tenant.findOneAndUpdate(
    { tent_id: Number(tent_id), tent_is_deleted: false },
    { $set: update },
    { new: true }
  ).lean();

  if (!tenant) {
    return {
      statusCode: 404,
      success: false,
      message: "Tenant not found",
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: "Tenant updated successfully",
    data: {
      tent_id: tenant.tent_id,
      tent_name: tenant.tent_name,
      tent_domain: tenant.tent_domain,
      tent_expiry_date: tenant.tent_expiry_date,
      tent_status: tenant.tent_status,
      tent_plan: tenant.tent_plan,
      tent_updated_at: tenant.tent_updated_at,
    },
  };
}

/**
 * Soft delete tenant by tent_id
 */
async function delete_tenant_service({ masterConnection, params, user }) {
  const Tenant = getTenantModel(masterConnection);
  const { tent_id } = params;

  const tenant = await Tenant.findOneAndUpdate(
    { tent_id: Number(tent_id), tent_is_deleted: false },
    {
      $set: {
        tent_is_deleted: true,
        tent_deleted_at: new Date(),
        tent_deleted_by: user?.admin_id || null,
      },
    },
    { new: true }
  ).lean();

  if (!tenant) {
    return {
      statusCode: 404,
      success: false,
      message: "Tenant not found",
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: "Tenant deleted successfully",
  };
}

module.exports = {
  get_all_tenants_service,
  update_tenant_service,
  delete_tenant_service,
};
