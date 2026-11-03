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
