const AppError = require("../utils/AppError");

function parseAppointmentDate(date) {
  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    throw new AppError("date no es una fecha válida", 400);
  }

  return parsedDate;
}

function parseTimeBlockId(timeBlockId) {
  const parsedTimeBlockId = parseInt(timeBlockId, 10);

  if (isNaN(parsedTimeBlockId)) {
    throw new AppError("timeBlockId debe ser un número válido", 400);
  }

  return parsedTimeBlockId;
}

//mover despues a helpers
function resolvePatientId(data, user) {
  const allowedRolesToAssign = ["ADMIN"];

  if (!allowedRolesToAssign.includes(user.role)) {
    return user.id;
  }

  if (!data.patientId) {
    throw new AppError("Se requiere el id del paciente", 400);
  }

  const parsedPatientId = parseInt(data.patientId, 10);

  if (isNaN(parsedPatientId) || parsedPatientId <= 0) {
    throw new AppError("patientId debe ser un número entero positivo", 400);
  }

  return parsedPatientId;
}

// --- Validators públicos ---

exports.appointmentIdValidator = (id) => {
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId) || parsedId <= 0) {
    throw new AppError(
      "El id de la cita debe ser un número entero positivo",
      400,
    );
  }

  return parsedId;
};

exports.createAppointmentValidator = (data, user) => {
  const { date, timeBlockId } = data;

  if (!date || !timeBlockId) {
    throw new AppError("date y timeBlockId son requeridos", 400);
  }

  return {
    date: parseAppointmentDate(date),
    timeBlockId: parseTimeBlockId(timeBlockId),
    patientId: resolvePatientId(data, user),
  };
};

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
