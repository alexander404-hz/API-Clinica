const express = require("express");
const app = express();

const routes = require("./routes");

const LoggerMiddleware = require("./middlewares/logger");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", routes);

app.use(LoggerMiddleware);

app.get("/", (req, res) => {
  res.send("Hello World");
});

module.exports = app;
