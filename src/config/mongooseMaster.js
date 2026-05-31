const mongoose = require("mongoose");

let masterConnection = null;

const DEFAULT_MONGOOSE_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 1,
  autoIndex: false,
};

function getMasterMongoUri() {
  const baseUrl = process.env.DB_URL;
  if (!baseUrl) {
    const err = new Error("Base MongoDB URL (DB_URL) is not configured");
    err.code = "DB_URL_NOT_CONFIGURED";
    throw err;
  }

  // Handle URLs with query parameters correctly
  const [base, query] = baseUrl.split('?');
  const sanitizedBase = base.replace(/\/+$/, "");
  const queryString = query ? `?${query}` : "";

  return `${sanitizedBase}/master${queryString}`;
}

async function getMasterConnection() {
  if (masterConnection && masterConnection.readyState === 1) {
    return masterConnection;
  }

  if (masterConnection && (masterConnection.readyState === 2 || masterConnection.readyState === 3)) {
    return masterConnection;
  }

  const uri = getMasterMongoUri();
  masterConnection = mongoose.createConnection(uri, DEFAULT_MONGOOSE_OPTIONS);

  masterConnection.on("error", (err) => {
    console.error('MongoDB error for master DB:', err.message);
  });

  masterConnection.on("disconnected", () => {
    console.warn("MongoDB disconnected for master DB.");
  });

  await new Promise((resolve, reject) => {
    masterConnection.once("connected", () => {
      console.log(`Connected to Master DB: ${masterConnection.name}`);
      resolve();
    });
    masterConnection.once("error", reject);
  });

  return masterConnection;
}

module.exports = {
  getMasterConnection,
};

