const AppError = require("../utils/AppError");

const {
  PrismaClient,
  PrismaClientKnownRequestError,
} = require("../../generated/prisma");

const {
  INVALID_REFERENCE,
  NOT_FOUND,
  FIELD_TAKEN,
} = require("../constants/errorCodes");

const prisma = new PrismaClient();

module.exports = (err) => {
  if (!(err instanceof PrismaClientKnownRequestError)) return err;

  switch (err.code) {
    case "P2002":
      const target = err?.meta.target;
      const fields = [].concat(target ?? []);

      return new AppError(
        "A unique field is already in use.",
        409,
        FIELD_TAKEN,
        fields.map((field) => ({
          field,
          message: `${field} is already in use.`,
        })),
      );
    case "P2025": // registro no encontrado en update/delete
      return new AppError("Resource not found.", 404, NOT_FOUND);
    case "P2003": // llave foránea inválida
      return new AppError(
        "Related resource does not exist.",
        409,
        INVALID_REFERENCE,
      );
    default:
      return err;
  }
};
