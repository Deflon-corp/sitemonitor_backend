const mongoose = require("mongoose");

/**
 * In-memory cache of tenant-specific Mongoose connections.
 * Key: normalized tenant db name (e.g. "tenant1")
 * Value: mongoose.Connection instance
 */
const connections = {};

const DEFAULT_MONGOOSE_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 1,
  autoIndex: false,
};

/**
 * Ensure that a database with the given (normalized) name already exists on the Mongo server.
 * This prevents accidental creation of new databases for unknown tenant ids.
 *
 * Returns the **actual** database name as stored in Mongo (with original casing),
 * so that we can connect using the correct case and avoid `DatabaseDifferCase` errors.
 */
async function ensureTenantDatabaseExists(normalizedDbName) {
  const baseConnection = mongoose.connection;
  normalizedDbName = 'tenant_' + normalizedDbName;
  if (!baseConnection || baseConnection.readyState !== 1 || !baseConnection.db) {
    const err = new Error("Base MongoDB connection is not ready");
    err.code = "DB_URL_NOT_CONFIGURED";
    throw err;
  }

  const admin = baseConnection.db.admin();
  const { databases } = await admin.listDatabases();

  const matchedDb = databases.find(
    (db) => typeof db.name === "string" && db.name.toLowerCase() === normalizedDbName
  );

  if (!matchedDb) {
    const err = new Error("Invalid Tenant Name");
    err.code = "INVALID_TENANT";
    throw err;
  }

  // Return the actual DB name (with its real casing), e.g. "Vinod"
  return matchedDb.name;
}

/**
 * Build the Mongo connection URI for a given database name using the base DB_URL
 * from the environment and the resolved database name as the database.
 *
 * Example:
 *   DB_URL=mongodb://localhost:27017
 *   dbName=tenant1
 *   => mongodb://localhost:27017/tenant1
 */
function getTenantMongoUri(dbName) {
  const baseUrl = process.env.DB_URL;

  if (!baseUrl) {
    const err = new Error("Base MongoDB URL (DB_URL) is not configured");
    err.code = "DB_URL_NOT_CONFIGURED";
    throw err;
  }

  if (!dbName || typeof dbName !== "string") {
    const err = new Error("Invalid Tenant Name");
    err.code = "INVALID_TENANT";
    throw err;
  }

  const trimmedDbName = dbName.trim();

  // Basic validation so obviously bad tenant names are rejected
  if (!trimmedDbName || !/^[a-z0-9_\-]+$/.test(trimmedDbName.toLowerCase())) {
    const err = new Error("Invalid Tenant Name");
    err.code = "INVALID_TENANT";
    throw err;
  }

  // Handle URLs with query parameters correctly
  // The database name must come before the '?'
  const [base, query] = baseUrl.split('?');
  const sanitizedBase = base.replace(/\/+$/, "");
  const queryString = query ? `?${query}` : "";

  return `${sanitizedBase}/${trimmedDbName}${queryString}`;
}

/**
 * Returns a cached or newly created Mongoose connection for the given tenant.
 * Safe for concurrent requests: the same connection object is reused.
 */
async function getTenantConnection(tenantId) {
  if (!tenantId) {
    throw new Error("tenant_id header is required");
  }
  const normalizedDbName = tenantId.trim().toLowerCase();

  // Validate that the tenant database already exists; if not, throw INVALID_TENANT.
  // Also get the **actual** DB name with correct casing (e.g. "Vinod").
  const actualDbName = await ensureTenantDatabaseExists(normalizedDbName);

  const cacheKey = actualDbName.toLowerCase();

  const existing = connections[cacheKey];

  if (existing && existing.readyState === 1) {
    return existing;
  }

  if (existing && (existing.readyState === 2 || existing.readyState === 3)) {
    return existing;
  }

  const uri = getTenantMongoUri(actualDbName);

  const conn = mongoose.createConnection(uri, DEFAULT_MONGOOSE_OPTIONS);
  connections[cacheKey] = conn;

  conn.on("error", (err) => {
    console.error(`MongoDB error for tenant "${tenantId}":`, err.message);
  });

  conn.on("disconnected", () => {
    console.warn(`MongoDB disconnected for tenant "${tenantId}".`);
  });

  await new Promise((resolve, reject) => {
    conn.once("connected", () => {
      console.log(`Connected to Tenant DB: ${conn.name}`);
      resolve();
    });
    conn.once("error", reject);
  });

  return conn;
}

/**
 * Create a new tenant database dynamically and return a Mongoose connection.
 * Database name format: tenant_<tenant_name> (e.g. tenant_abccompany).
 * MongoDB creates the database on first write. Connection is cached.
 *
 * @param {string} dbName - Normalized DB name (e.g. "tenant_abccompany")
 * @returns {Promise<mongoose.Connection>}
 */
async function createTenantConnection(dbName) {
  if (!dbName || typeof dbName !== "string") {
    const err = new Error("Invalid tenant database name");
    err.code = "INVALID_TENANT";
    throw err;
  }

  const normalizedDbName = dbName.trim().toLowerCase();
  if (!normalizedDbName || !/^tenant_[a-z0-9_\-]+$/.test(normalizedDbName)) {
    const err = new Error("Invalid tenant database name; must be tenant_<name>");
    err.code = "INVALID_TENANT";
    throw err;
  }

  const cacheKey = normalizedDbName;
  const existing = connections[cacheKey];
  if (existing && existing.readyState === 1) {
    return existing;
  }

  const uri = getTenantMongoUri(normalizedDbName);
  const conn = mongoose.createConnection(uri, DEFAULT_MONGOOSE_OPTIONS);
  connections[cacheKey] = conn;

  conn.on("error", (err) => {
    console.error(`MongoDB error for tenant DB "${dbName}":`, err.message);
  });

  conn.on("disconnected", () => {
    console.warn(`MongoDB disconnected for tenant DB "${dbName}".`);
  });

  await new Promise((resolve, reject) => {
    conn.once("connected", () => {
      console.log(`Connected to Tenant DB: ${conn.name}`);
      resolve();
    });
    conn.once("error", reject);
  });

  return conn;
}

module.exports = {
  getTenantConnection,
  createTenantConnection,
  getTenantMongoUri,
};

