const AppError = require("../utils/AppError");
const { INTERNAL_ERROR } = require("../constants/errorCodes");
const translatePrismaError = require("../utils/translatePrismaError");

module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  err = translatePrismaError(err);

  const statusCode = err.statusCode || 500;
  const isServerError = statusCode >= 500;

  const logPrefix = `[ERROR] ${new Date().toISOString()} ${req.method} ${req.originalUrl} - ${statusCode}`;

  if (err.isOperational) {
    console.log(logPrefix, "-", err.code);
  } else {
    console.error(logPrefix);
    console.error(err.stack || err);
  }

  res.status(statusCode).json({
    error: {
      code: isServerError ? INTERNAL_ERROR : (err.code ?? "BAD REQUEST"),
      message: isServerError ? "An unexpected error occurred." : err.message,
      ...(!isServerError && err.details && { details: err.details }),
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};
