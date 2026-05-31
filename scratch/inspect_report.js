const mongoose = require("mongoose");
const BASE_URL = "mongodb+srv://sitemonitor26_db_user:lbbxaH2mDEHLyitL@cluster0.ev4p3qf.mongodb.net";

async function inspectReport() {
  try {
    const targetDb = "tenant_sbi";
    const tenantConn = await mongoose.createConnection(`${BASE_URL}/${targetDb}?appName=Cluster0`).asPromise();

    const DomainReport = tenantConn.model("DomainReport", new mongoose.Schema({}), "domain_reports");

    const report = await DomainReport.findOne({ domain: "omunim.com", jobId: "40" }).lean();
    console.log("Report URL:", report.url);
    console.log("Keys in report:", Object.keys(report));
    console.log("seoImprovements:", JSON.stringify(report.seoImprovements, null, 2));
    
    if (report.links) console.log("links:", JSON.stringify(report.links, null, 2));
    if (report.brokenLinks) console.log("brokenLinks:", JSON.stringify(report.brokenLinks, null, 2));

    await tenantConn.close();
  } catch (err) {
    console.error("Error:", err);
  }
}

inspectReport();
