const mongoose = require("mongoose");
const { domainSchema } = require("../src/modules/domain/models/domain.schema");
const { domainSummarySchema } = require("../src/modules/domain/models/domainSummary.schema");
const { domainReportSchema } = require("../src/modules/domain/models/domainReport.schema");

const BASE_URL = "mongodb+srv://sitemonitor26_db_user:lbbxaH2mDEHLyitL@cluster0.ev4p3qf.mongodb.net";

async function validate() {
  try {
    const targetDb = "tenant_sbi";
    console.log(`Connecting to tenant DB: ${targetDb}`);
    const tenantConn = await mongoose.createConnection(`${BASE_URL}/${targetDb}?appName=Cluster0`).asPromise();

    const Domain = tenantConn.model("Domain", domainSchema, "domains");
    const DomainSummary = tenantConn.model("DomainSummary", domainSummarySchema, "domain_summaries");
    const DomainReport = tenantConn.model("DomainReport", domainReportSchema, "domain_reports");

    // Get latest report to get domain and jobId
    const latestReport = await DomainReport.findOne().sort({ scanDate: -1 }).lean();
    if (!latestReport) {
      console.log(`No reports found in ${targetDb}.`);
      await tenantConn.close();
      return;
    }

    const host = latestReport.domain;
    const jobId = latestReport.jobId;
    console.log(`Validating domain: ${host} (jobId: ${jobId})`);

    const reports = await DomainReport.find({ domain: host, jobId });
    console.log(`Found ${reports.length} reports for this job.`);

    // Check broken links
    let totalBrokenLinks = 0;
    const brokenLinkPages = [];
    reports.forEach(r => {
      const bl = r.brokenLinks || r.broken_links || r.links?.broken || [];
      if (bl.length > 0) {
        totalBrokenLinks += bl.length;
        brokenLinkPages.push({ url: r.url, count: bl.length });
      }
    });

    console.log(`Total Broken Links from Reports: ${totalBrokenLinks}`);
    console.log(`Affected Pages: ${brokenLinkPages.length}`);
    
    // Check SEO Health (Meta Title Missing)
    const metaTitleMissing = reports.filter(r => !r.meta?.title).length;
    console.log(`Meta Title Missing: ${metaTitleMissing}`);

    const metaDescMissing = reports.filter(r => !r.meta?.description).length;
    console.log(`Meta Description Missing: ${metaDescMissing}`);

    // Check performance
    const perfScores = reports.map(r => r.performance?.score || r.lighthousePerformanceScore || 0).filter(s => s > 0);
    const avgPerf = perfScores.length > 0 ? Math.round(perfScores.reduce((a, b) => a + b, 0) / perfScores.length) : 0;
    console.log(`Average Performance Score: ${avgPerf}`);

    // Summary data
    const summary = await DomainSummary.findOne({ domain: host, jobId }).lean();
    if (summary) {
        console.log("Summary Top Issues:");
        summary.topIssues.forEach(i => {
          console.log(` - ${i.message}: ${i.count} (Priority: ${i.priority})`);
        });
    } else {
        console.log("No summary found for this jobId.");
    }

    await tenantConn.close();
    console.log("Validation complete.");
  } catch (err) {
    console.error("Validation error:", err);
  }
}

validate();
