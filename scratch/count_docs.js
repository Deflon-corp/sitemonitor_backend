const mongoose = require("mongoose");
const BASE_URL = "mongodb+srv://sitemonitor26_db_user:lbbxaH2mDEHLyitL@cluster0.ev4p3qf.mongodb.net";

async function countDocs() {
  try {
    const targetDb = "tenant_omunim";
    const tenantConn = await mongoose.createConnection(`${BASE_URL}/${targetDb}?appName=Cluster0`).asPromise();

    const Domain = tenantConn.model("Domain", new mongoose.Schema({}), "domains");
    const DomainSummary = tenantConn.model("DomainSummary", new mongoose.Schema({}), "domain_summaries");
    const DomainReport = tenantConn.model("DomainReport", new mongoose.Schema({}), "domain_reports");

    console.log(`Domains: ${await Domain.countDocuments()}`);
    console.log(`Summaries: ${await DomainSummary.countDocuments()}`);
    console.log(`Reports: ${await DomainReport.countDocuments()}`);

    const latestReport = await DomainReport.findOne().sort({ createdAt: -1 }).lean();
    if (latestReport) {
        console.log("Latest Report URL:", latestReport.url);
        console.log("Latest Report jobId:", latestReport.jobId);
    }

    await tenantConn.close();
  } catch (err) {
    console.error("Error:", err);
  }
}

countDocs();
