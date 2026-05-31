const mongoose = require("mongoose");
const BASE_URL = "mongodb+srv://sitemonitor26_db_user:lbbxaH2mDEHLyitL@cluster0.ev4p3qf.mongodb.net";

async function listDbs() {
  try {
    const conn = await mongoose.createConnection(`${BASE_URL}/?appName=Cluster0`).asPromise();
    const admin = conn.db.admin();
    const { databases } = await admin.listDatabases();
    console.log("Databases:");
    databases.forEach(db => console.log(` - ${db.name}`));
    await conn.close();
  } catch (err) {
    console.error("Error:", err);
  }
}

listDbs();
