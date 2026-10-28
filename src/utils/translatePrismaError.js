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
  CONFLICT,
  VALIDATION_ERROR,
} = require("../constants/errorCodes");

// Devuelve el código del error de BD
const getDbCode = (err) => {
  if (err instanceof PrismaClientKnownRequestError) return err.code;
  if (err instanceof PrismaClientUnknownRequestError) {
    return err.message.match(/code: "(\w+)"/)?.[1];
  }
  return undefined;
};

const OVERLAP_MESSAGES = {
  appointment_no_overlap: "The selected time block is no longer available.",
  time_block_no_overlap: "The time block overlaps with an existing one.",
};

const RANGE_MESSAGES = {
  appointment_valid_range: "The appointment must end after it starts.",
  time_block_valid_range: "The time block must end after it starts.",
};

// Devuelve el mensaje asociado al primer constraint cuyo nombre aparezca en el error
const messageForConstraint = (err, messages, fallback) => {
  const text = String(err?.message ?? "");
  const name = Object.keys(messages).find((n) => text.includes(n));
  return name ? messages[name] : fallback;
};

const getUniqueFields = (err) => {
  const { target, driverAdapterError } = err.meta ?? {};
  if (target?.length) return [].concat(target);

  const cause = driverAdapterError?.cause;
  const fields = cause?.constraint?.fields;
  if (fields?.length) return fields.map((f) => String(f).replace(/"/g, ""));

  // Solo llega el nombre de la restricción entre comillas, en el idioma del servidor:
  //   «User_email_key»   "User_email_key"
  const name =
    cause?.constraint?.index ??
    cause?.originalMessage?.match(/[«"“„]([^»"”“]+)[»"”“]/)?.[1];

  // Prisma nombra los únicos como Tabla_campo_key
  const match = name?.match(/^[^_]+_(.+)_key$/);
  return match ? [match[1]] : [];
};

module.exports = (err) => {
  switch (getDbCode(err)) {
    case "P2002": {
      fields = getUniqueFields(err);

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
    case "23P01": // exclusion_violation
      return new AppError(
        messageForConstraint(
          err,
          OVERLAP_MESSAGES,
          "The resource overlaps with an existing one.",
        ),
        409,
        CONFLICT,
      );
    case "23514": // check_violation
      return new AppError(
        messageForConstraint(
          err,
          RANGE_MESSAGES,
          "A value violates a database rule.",
        ),
        400,
        VALIDATION_ERROR,
      );
    default:
      return err;
  }
};
