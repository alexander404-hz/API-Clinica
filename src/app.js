const AppError = require("./utils/AppError");
const express = require("express");
const app = express();
const routes = require("./routes");
const LoggerMiddleware = require("./middlewares/logger");
const errorHandler = require("./middlewares/errorHandler");
const { NOT_FOUND } = require("./constants/errorCodes");

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(LoggerMiddleware);
app.use("/api", routes);

app.get("/", (req, res) => {
  console.log("XFF:", req.headers["x-forwarded-for"], "| req.ip:", req.ip);

  res.send("Services enabled   =D");
});

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
