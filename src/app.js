const AppError = require("./utils/AppError");
const express = require("express");
const app = express();
const routes = require("./routes");
const LoggerMiddleware = require("./middlewares/logger");
const errorHandler = require("./middlewares/errorHandler");
const { NOT_FOUND } = require("./constants/errorCodes");

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const swaggerUi = require("swagger-ui-express");

const openapiDoc = yaml.load(
  fs.readFileSync(path.join(__dirname, "../docs/openapi.yaml"), "utf8"),
);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 3);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(LoggerMiddleware);

const { Client } = require("pg");

async function medir(url) {
  const t0 = Date.now();
  const client = new Client({ connectionString: url });
  await client.connect();
  const t1 = Date.now();
  await client.query("SELECT 1");
  const t2 = Date.now();
  await client.end();
  return { conectarMs: t1 - t0, consultaMs: t2 - t1 };
}

app.get("/debug/db", async (req, res) => {
  const [pooled, direct] = await Promise.all([
    medir(process.env.DATABASE_URL),
    medir(process.env.DIRECT_DATABASE_URL),
  ]);
  res.json({ pooled, direct });
});

app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Services enabled   =D");
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiDoc, { customSiteTitle: "API Clínica" }),
);

app.use((req, res, next) => {
  next(
    new AppError(
      `Route ${req.method} ${req.originalUrl} not found.`,
      404,
      NOT_FOUND,
    ),
  );
});

app.use(errorHandler);

module.exports = app;
