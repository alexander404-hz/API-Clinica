module.exports = (req, res, next) => {
  const timestamp = new Date().toDateString();
  const reqLog = `[${timestamp} ${req.method} ${req.protocol} ${req.hostname} ${req.url} - IP: ${req.ip}]`;

  console.log(reqLog);

  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const endLog = `[${timestamp}] Response: ${res.statusCode} - ${duration}ms`;

    console.log(endLog);
  });

  next();
};
