const mongoose = require("mongoose");
const { domainReportSchema } = require("../src/modules/domain/models/domainReport.schema");

const BASE_URL = "mongodb+srv://sitemonitor26_db_user:lbbxaH2mDEHLyitL@cluster0.ev4p3qf.mongodb.net";

async function run() {
  try {
    const tenantDb = "tenant_sbi";
    console.log(`Connecting to ${tenantDb}...`);
    const conn = await mongoose.createConnection(`${BASE_URL}/${tenantDb}?appName=Cluster0`).asPromise();
    const DomainReport = conn.model("DomainReport", domainReportSchema, "domain_reports");

    const host = "omunim.com"; // Let's use the active domain
    console.log(`Querying reports for host: ${host}`);

    // Print first report structure
    const sample = await DomainReport.findOne({ domain: host }).lean();
    if (!sample) {
      console.log("No reports found for domain");
      await conn.close();
      return;
    }

    console.log("Sample document keys:", Object.keys(sample));
    console.log("Sample meta:", sample.meta);
    console.log("Sample headings:", sample.headings);
    console.log("Sample images:", sample.images ? Object.keys(sample.images) : "None");
    if (sample.images && sample.images.list) {
      console.log(`Sample images.list size: ${sample.images.list.length}`);
    }

    // Now test each issue filter
    const testCases = {
      "meta-title-missing": [
        { 'meta.title': { $in: [null, ""] } },
        { 'meta.title': { $exists: false } }
      ],
      "meta-description-missing": [
        { 'meta.description': { $in: [null, ""] } },
        { 'meta.description': { $exists: false } }
      ],
      "meta-description-too-long": [
        { 'meta.description': { $regex: /^.{156,}$/ } },
        { 'seoImprovements.message': { $regex: /description.*too.*long/i } }
      ],
      "meta-description-too-short": [
        { 'meta.description': { $regex: /^.{1,29}$/ } },
        { 'seoImprovements.message': { $regex: /description.*too.*short/i } }
      ],
      "h1-tags-missing": [
        { 'headings.h1': 0 },
        { 'headings.h1': { $exists: false } }
      ],
      "multiple-h1-tags": [
        { 'headings.h1': { $gt: 1 } }
      ],
      "no-canonical": [
        { 'meta.canonical': { $in: [null, ""] } },
        { 'meta.canonical': { $exists: false } }
      ],
      "missing-alt-text": [
        { 'images.withoutAlt': { $gt: 0 } }
      ]
    };

    for (const [key, filters] of Object.entries(testCases)) {
      const q = { domain: host, $or: filters };
      const count = await DomainReport.countDocuments(q);
      console.log(`Filter [${key}] matches: ${count} documents`);
    }

    await conn.close();
  } catch (err) {
    console.error("Error running test query:", err);
  }
}

run();
