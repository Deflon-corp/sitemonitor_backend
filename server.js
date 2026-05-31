require("dotenv").config({ path: require("path").join(__dirname, ".env"), quiet: true });

const mongoose = require("mongoose");
const app = require("./index");
const swaggerUi = require("swagger-ui-express");
const specs = require("./src/config/swagger");
const ora = require("ora").default; // loader (ESM default export)

const PORT = process.env.USER_MS_PORT || 3000;
const DB_URL = process.env.DB_URL;

// Swagger route
const swaggerOptions = {
  customCss: `.models { display: none !important; }`,
  swaggerOptions: {
    persistAuthorization: true,
    filter: true,
  },
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
app.use("/api/v1", swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

async function startServer() {

  const spinner = ora("Starting Sitemonitor Server...").start();

  if (!DB_URL) {
    spinner.warn("DB_URL is not set in .env. Skipping DB connection check.");
  } else {
    try {
      spinner.text = "Connecting to Database Server...";
      await mongoose.connect(DB_URL, { maxPoolSize: 5 });

      spinner.succeed(`Database connected successfully to: ${mongoose.connection.name} 🗄️`);
    } catch (err) {
      spinner.fail("Database connection failed ❌");
      process.exit(1);
    }
  }

  app.listen(PORT, () => {
    console.log("🚀 Sitemonitor Server Started Successfully");
    console.log(`🌐 API running on: http://localhost:${PORT}`);
    console.log(`📜 Swagger Docs: http://localhost:${PORT}/api-docs`);
  });
}

startServer();