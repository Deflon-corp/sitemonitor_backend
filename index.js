const express = require("express");
const cors = require("cors");
const path = require("path");
const { helmetMiddleware, apiRateLimiter } = require("./src/common/middlewares/security.middleware");
const { tenantConnectionMiddleware } = require("./src/common/middlewares/tenant.middleware");
const { superTenantMiddleware } = require("./src/common/middlewares/super_tenant.middleware");
const { getMasterConnection } = require("./src/config/mongooseMaster");
const adminRouter = require("./src/modules/admin/routes/admin.routes");
const superAdminRouter = require("./src/modules/super_admin/routes/super_admin.routes");
const tenantRouter = require("./src/modules/tenant/routes/tenant.routes");
const userRouter = require("./src/modules/user/routes/user.routes");
const authRouter = require("./src/modules/auth/routes/auth.routes");
const domainRouter = require("./src/modules/domain/routes/domain.routes");
const inventoryRouter = require("./src/modules/inventory/routes/inventory.routes");
const domainInventoryRouter = require("./src/modules/inventory/routes/domainInventory.routes");
const policyRouter = require("./src/modules/policy/routes/policy.routes");
const ruleRouter = require("./src/modules/rule/routes/rule.routes");
const auditRouter = require("./src/modules/audit/routes/audit.routes");
const heartbeatRouter = require("./src/modules/heartbeat/routes/heartbeat.routes");
const domainPerformanceRouter = require("./src/modules/performance/routes/domainPerformance.routes");
const qaRouter = require("./src/modules/qa/routes/qa.routes");
const accessibilityRouter = require("./src/modules/accessibility/routes/accessibility.routes");



const app = express();

// Body parser
app.use(express.json());

// Proper CORS setup
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);

      // allow localhost frontend
      if (origin === "http://localhost:3000") {
        return callback(null, true);
      }

      // allow render backend origin
      if (origin === "https://sitemonitor-backend.onrender.com") {
        return callback(null, true);
      }

      // allow all subdomains like *.sitemonitor.in
      const sitemonitorRegex = /^https:\/\/([a-zA-Z0-9.-]+)\.sitemonitor\.in$/;
      if (sitemonitorRegex.test(origin)) {
        return callback(null, true);
      }

      // allow all subdomains like *.localhost:5000
      const regex = /^http:\/\/([a-zA-Z0-9-]+)\.localhost:5000$/;

      if (regex.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Security middlewares
app.use(helmetMiddleware);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve homepage
const htmlPath = path.join(__dirname, "./public/index.html");
app.get("/", (req, res) => res.sendFile(htmlPath));

// Health route that requires tenant_id and uses tenant DB connection
app.get("/api/health", apiRateLimiter, tenantConnectionMiddleware, async (req, res) => {
  return res.json({
    success: true,
    message: "User service is healthy",
    tenant: req.tenantId,
    dbState: req.tenantConnection.readyState,
  });
});

// Admin routes (create, update, delete, login)
// If POST / with no tenant_id header, assume create tenant+admin. Otherwise use tenantConnectionMiddleware.
app.use(
  "/api/admin",
  apiRateLimiter,
  async (req, res, next) => {
    const isPostCreate = req.method === "POST" && (!req.path || req.path === "/");
    const hasTenantId = !!req.header("tenant_id");

    if (isPostCreate && !hasTenantId) {
      try {
        const conn = await getMasterConnection();
        req.masterConnection = conn;
        req.createTenantAndAdmin = true;
        return next();
      } catch (err) {
        console.error("Master connection for create tenant+admin:", err);
        return res.status(500).json({
          success: false,
          message: "Unable to connect to master database",
        });
      }
    }
    return tenantConnectionMiddleware(req, res, next);
  },
  adminRouter
);

// Super Admin routes (requires tenant_id: super; uses master DB)
app.use("/api/super_admin", apiRateLimiter, superTenantMiddleware, superAdminRouter);

// Tenant routes (super admin only; requires tenant_id: super; uses master DB)
app.use("/api/tenant", apiRateLimiter, superTenantMiddleware, tenantRouter);

app.use("/api/users", apiRateLimiter, tenantConnectionMiddleware, userRouter);

// Auth Routes (Login and Refresh Token)
app.use("/api/auth", apiRateLimiter, tenantConnectionMiddleware, authRouter);

app.use("/api/domains", apiRateLimiter, tenantConnectionMiddleware, domainRouter);
app.use("/api/inventory", apiRateLimiter, tenantConnectionMiddleware, inventoryRouter);
app.use("/api/domain/inventory", apiRateLimiter, tenantConnectionMiddleware, domainInventoryRouter);
app.use("/api/policies", apiRateLimiter, tenantConnectionMiddleware, policyRouter);
app.use("/api/rules", apiRateLimiter, tenantConnectionMiddleware, ruleRouter);
app.use("/api/audit", apiRateLimiter, tenantConnectionMiddleware, auditRouter);
app.use("/api/heartbeat", apiRateLimiter, tenantConnectionMiddleware, heartbeatRouter);
app.use("/api/domain/performance", apiRateLimiter, tenantConnectionMiddleware, domainPerformanceRouter);
app.use("/api/qa", apiRateLimiter, tenantConnectionMiddleware, qaRouter);
app.use("/api/accessibility", apiRateLimiter, tenantConnectionMiddleware, accessibilityRouter);



module.exports = app;
