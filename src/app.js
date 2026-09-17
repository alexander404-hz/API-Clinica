const express = require("express");
const app = express();

const routes = require("./routes");

const LoggerMiddleware = require("./middlewares/logger");
const errorHandler = require("./middlewares/errorHandler");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(LoggerMiddleware);
app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use(errorHandler);

module.exports = app;
