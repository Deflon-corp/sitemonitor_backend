const mongoose = require("mongoose");
const BASE_URL = "mongodb+srv://sitemonitor26_db_user:lbbxaH2mDEHLyitL@cluster0.ev4p3qf.mongodb.net";

async function inspectReport() {
  try {
    const targetDb = "tenant_sbi";
    const tenantConn = await mongoose.createConnection(`${BASE_URL}/${targetDb}?appName=Cluster0`).asPromise();

    const DomainReport = tenantConn.model("DomainReport", new mongoose.Schema({}), "domain_reports");

    const report = await DomainReport.findOne({ domain: "omunim.com", jobId: "40" }).lean();
    console.log("Report URL:", report.url);
    
    if (report.headings) console.log("headings:", JSON.stringify(report.headings, null, 2));

    await tenantConn.close();
  } catch (err) {
    console.error("Error:", err);
  }
}

inspectReport();
