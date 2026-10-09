const AppError = require("../utils/AppError");
const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
} = require("../../generated/prisma");
const {
  INVALID_REFERENCE,
  NOT_FOUND,
  FIELD_TAKEN,
  RESOURCE_IN_USE,
} = require("../constants/errorCodes");

// Devuelve el código del error de BD
const getDbCode = (err) => {
  if (err instanceof PrismaClientKnownRequestError) return err.code;
  if (err instanceof PrismaClientUnknownRequestError) {
    return err.message.match(/code: "(\w+)"/)?.[1];
  }
  return undefined;
};

module.exports = (err) => {
  switch (getDbCode(err)) {
    case "P2002": {
      const fields = [].concat(err.meta?.target ?? []);
      return new AppError(
        "A unique field is already in use.",
        409,
        FIELD_TAKEN,
        fields.map((field) => ({
          field,
          message: `${field} is already in use.`,
        })),
      );
    }
    case "P2025":
      return new AppError(
        `${err.meta?.modelName ?? "Resource"} not found.`,
        404,
        NOT_FOUND,
      );
    case "P2003":
      return new AppError(
        "Related resource does not exist.",
        409,
        INVALID_REFERENCE,
      );
    case "23001": // restrict_violation
    case "23503": // foreign_key_violation
      return new AppError(
        "This resource cannot be deleted because other records depend on it.",
        409,
        RESOURCE_IN_USE,
      );
    default:
      return err;
  }
};