const mongoose = require("mongoose");
const BASE_URL = "mongodb+srv://sitemonitor26_db_user:lbbxaH2mDEHLyitL@cluster0.ev4p3qf.mongodb.net";

async function findData() {
  try {
    const dbs = ["tenant_omunim", "tenant_rbi", "tenant_sbi", "test"];
    for (const dbName of dbs) {
        console.log(`Checking ${dbName}...`);
        const conn = await mongoose.createConnection(`${BASE_URL}/${dbName}?appName=Cluster0`).asPromise();
        
        const Domain = conn.model("Domain", new mongoose.Schema({}), "domains");
        const count = await Domain.countDocuments();
        console.log(` - Domains: ${count}`);
        
        if (count > 0) {
            const DomainReport = conn.model("DomainReport", new mongoose.Schema({}), "domain_reports");
            const reportCount = await DomainReport.countDocuments();
            console.log(` - Reports: ${reportCount}`);
            if (reportCount > 0) {
                console.log(`Found data in ${dbName}!`);
                await conn.close();
                break;
            }
        }
        await conn.close();
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

findData();
