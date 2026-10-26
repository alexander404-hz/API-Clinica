const AppError = require("../utils/AppError");

const { NOT_FOUND } = require("../constants/errorCodes");

const {
  MS_PER_MINUTE,
  CLINIC_UTC_OFFSET_MINUTES,
  MS_PER_DAY,
} = require("../constants/config");

function nestFilter(path, filter) {
  return path
    .split(".")
    .reduceRight((inner, key) => ({ [key]: inner }), filter);
}

exports.buildRangeFilter = (from, to) => {
  const range = {
    ...(from && { gte: from }),
    ...(to && { lte: to }),
  };

  return Object.keys(range).length > 0 ? range : undefined;
};

exports.assertFound = (resource, label = "Resource") => {
  if (!resource) {
    throw new AppError(`${label} not found.`, 404, NOT_FOUND);
  }
};

exports.contains = (value) => ({ contains: value, mode: "insensitive" });

exports.buildSearchConditions = (words = [], fields = []) =>
  words.map((word) => ({
    OR: fields.map((field) => nestFilter(field, exports.contains(word))),
  }));

/**
 * Dado un Date en medianoche UTC del día pedido (ej. 2026-10-14T00:00:00Z),
 * devuelve el inicio y fin de ese día en hora de la clínica, como instantes reales.
 */
exports.getClinicDayRange = (date) => {
  const startMs = date.getTime() - CLINIC_UTC_OFFSET_MINUTES * MS_PER_MINUTE;

  return {
    dayStart: new Date(startMs),
    dayEnd: new Date(startMs + MS_PER_DAY),
  };
};

/**
 * Dado un instante, devuelve la fecha (medianoche UTC) del día
 * en que cae ese instante en hora de la clínica.
 * Es lo inverso de getClinicDayRange.
 */
exports.getClinicDateOf = (instant) => {
  const localMs = instant.getTime() + CLINIC_UTC_OFFSET_MINUTES * MS_PER_MINUTE;
  const local = new Date(localMs);

  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()),
  );
};
