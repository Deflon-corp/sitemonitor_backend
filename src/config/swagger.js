const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sitemonitor User API",
      version: "1.0.0",
      description: `
      Multi-tenant User Service API

      🔐 Authorization Flow:
      1) Create Admin
      2) Login Admin (optionally send tenant info in body)
      3) Create Tenant
      4) Use tenant-specific APIs

      ⚠ Important:
      - Click Authorize
      - Enter JWT in BearerAuth
      - Enter tenant id (e.g. vinod, rahul; for super admin use "super") in tenant_id
      - Swagger will send header: tenant_id
      `,
    },

    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Development Server",
      },
      {
        url: "http://localhost:5000",
        description: "Frontend Development Server",
      },
        {
        url: "https://sitemonitor-backend.onrender.com",
        description: "Frontend Development Server",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },

        tenant_id: {
          type: "apiKey",
          in: "header",
          name: "tenant_id", // This MUST match backend header
          description:
            "Tenant identifier header. Example: vinod, rahul (sent as tenant_id)",
        },
      },
    },

    // ✅ Global Security (Applied to all APIs)
    security: [
      {
        bearerAuth: [],
        tenant_id: [],
      },
    ],
  },

  apis: [
    // Centralized module-based structure
    "./src/modules/**/document/*.js",
    "./src/modules/**/routes/*.js",
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;