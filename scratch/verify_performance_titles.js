const mongoose = require("mongoose");
const performanceService = require("../src/modules/performance/services/domainPerformance.service");

const BASE_URL = "mongodb+srv://sitemonitor26_db_user:lbbxaH2mDEHLyitL@cluster0.ev4p3qf.mongodb.net";
const targetDb = "tenant_omunim";

async function verify() {
  try {
    const tenantConn = await mongoose.createConnection(`${BASE_URL}/${targetDb}?appName=Cluster0`).asPromise();

    const { domainSchema } = require("../src/modules/domain/models/domain.schema");
    const DomainModel = tenantConn.models.Domain || tenantConn.model("Domain", domainSchema, "domains");

    const domainDoc = await DomainModel.findOne({ dm_is_deleted: false }).lean();
    if (!domainDoc) {
      console.log("No domains found in database!");
      await tenantConn.close();
      return;
    }

    console.log(`Found Domain: ${domainDoc.dm_url} (ID: ${domainDoc.dm_id})`);

    // Call service to get performance pages
    const result = await performanceService.getPerformancePages({
      tenantConnection: tenantConn,
      domainId: domainDoc.dm_id.toString(),
      page: 1,
      limit: 5,
    });

    if (result.success) {
      console.log(`Successfully fetched ${result.data.pages.length} pages!`);
      result.data.pages.forEach((p, idx) => {
        console.log(`Page #${idx + 1}:`);
        console.log(`  Title: "${p.title}"`);
        console.log(`  URL:   ${p.url}`);
        console.log(`  Score: ${p.performanceScore}`);
      });

      // Try searching for one of the titles (case-insensitively)
      if (result.data.pages.length > 0) {
        const firstPage = result.data.pages[0];
        const searchWord = firstPage.title.split(" ")[0] || "Home";
        console.log(`\nTesting search for: "${searchWord}"`);
        const searchResult = await performanceService.getPerformancePages({
          tenantConnection: tenantConn,
          domainId: domainDoc.dm_id.toString(),
          page: 1,
          limit: 5,
          search: searchWord,
        });

        if (searchResult.success) {
          console.log(`Search matched ${searchResult.data.pages.length} pages:`);
          searchResult.data.pages.forEach((p) => {
            console.log(`  - Title: "${p.title}" | URL: ${p.url}`);
          });
        } else {
          console.log("Search failed:", searchResult.message);
        }
      }
    } else {
      console.log("Error fetching performance pages:", result.message);
    }

    await tenantConn.close();
  } catch (err) {
    console.error("Verification failed:", err);
  }
}

verify();
