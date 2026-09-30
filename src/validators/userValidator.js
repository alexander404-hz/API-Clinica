const AppError = require("../utils/AppError");
const { assertValidBody, fieldChecker } = require("./validatorUtils");
const { VALIDATION_ERROR } = require("../constants/errorCodes");
const {
  validateName,
  validateEmail,
  validateRole,
} = require("./fieldValidator");

exports.createUserValidator = (data) => {
  assertValidBody(data);

  const { firstName, lastName, email } = data;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  check("firstName", validateName(firstName, "First name"));
  check("lastName", validateName(lastName, "Last name"));
  check("email", validateEmail(email));

  if (errors.length > 0) {
    throw new AppError(
      "Validation failed; check and fix it.",
      400,
      VALIDATION_ERROR,
      errors,
    );
  }

  return cleaned;
};

/* 
exports.listAppointmentsValidator = (query, user) => {
  const { date, timeBlockId, patientId } = query;
  const filters = {};

  if (date !== undefined) {
    filters.date = parseAppointmentDate(date);
  }

  if (timeBlockId !== undefined) {
    filters.timeBlockId = parseTimeBlockId(timeBlockId);
  }

  if (patientId !== undefined && user.role === "ADMIN") {
    const parsedPatientId = parseInt(patientId, 10);

    if (isNaN(parsedPatientId) || parsedPatientId <= 0) {
      throw new AppError("patientId debe ser un número entero positivo", 400);
    }

    filters.patientId = parsedPatientId;
  }

  return filters;
};

exports.updateAppointmentValidator = (data) => {
  const { date, timeBlockId } = data;

  if (date === undefined && timeBlockId === undefined) {
    throw new AppError(
      "Debes enviar al menos un campo para actualizar (date o timeBlockId)",
      400,
    );
  }

  const result = {};

  if (date !== undefined) {
    result.date = parseAppointmentDate(date);
  }

  if (timeBlockId !== undefined) {
    result.timeBlockId = parseTimeBlockId(timeBlockId);
  }

  return result;
};
 */
