const mongoose = require("mongoose");
const BASE_URL = "mongodb+srv://sitemonitor26_db_user:lbbxaH2mDEHLyitL@cluster0.ev4p3qf.mongodb.net";

async function listCollections() {
  try {
    const targetDb = "tenant_omunim";
    console.log(`Connecting to tenant DB: ${targetDb}`);
    const tenantConn = await mongoose.createConnection(`${BASE_URL}/${targetDb}?appName=Cluster0`).asPromise();

    const collections = await tenantConn.db.listCollections().toArray();
    console.log("Collections:");
    collections.forEach(c => console.log(` - ${c.name}`));

    await tenantConn.close();
  } catch (err) {
    console.error("Error:", err);
  }
}

listCollections();
