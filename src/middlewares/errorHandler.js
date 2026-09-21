exports.errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || 500;
  const isServerError = statusCode >= 500;

  console.error(
    `[ERROR] ${new Date().toISOString()} ${req.method} ${req.originalUrl} - ${statusCode}`,
  );

  console.error(err.stack || err);

  const message = isServerError ? "Ocurrio un error inesperado" : err.message;

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : ""),
  });
};
