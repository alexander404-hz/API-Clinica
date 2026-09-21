function parseAppointmentDate(date) {
  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    const error = new Error("date no es una fecha válida");
    error.statusCode = 400;
    throw error;
  }

  return parsedDate;
}

function parseTimeBlockId(timeBlockId) {
  const parsedTimeBlockId = parseInt(timeBlockId, 10);

  if (isNaN(parsedTimeBlockId)) {
    const error = new Error("timeBlockId debe ser un número válido");
    error.statusCode = 400;
    throw error;
  }

  return parsedTimeBlockId;
}

function resolveUserId(data, user) {
  const allowedRolesToAssign = ["ADMIN", "DOCTOR"];

  if (!allowedRolesToAssign.includes(user.role)) {
    return user.id;
  }

  if (!data.userId) {
    const error = new Error("Se requiere el id del paciente");
    error.statusCode = 400;
    throw error;
  }

  const parsedUserId = parseInt(data.userId, 10);

  if (isNaN(parsedUserId) || parsedUserId <= 0) {
    const error = new Error("userId debe ser un número entero positivo");
    error.statusCode = 400;
    throw error;
  }

  return parsedUserId;
}

// --- Validators públicos ---

exports.createAppointmentValidator = (data, user) => {
  const { date, timeBlockId } = data;

  if (!date || !timeBlockId) {
    const error = new Error("date y timeBlockId son requeridos");
    error.statusCode = 400;
    throw error;
  }

  return {
    date: parseAppointmentDate(date),
    timeBlockId: parseTimeBlockId(timeBlockId),
    userId: resolveUserId(data, user),
  };
};

exports.appointmentIdValidator = (id) => {
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId) || parsedId <= 0) {
    const error = new Error("El id de la cita debe ser un número entero positivo");
    error.statusCode = 400;
    throw error;
  }

  return parsedId;
};

exports.updateAppointmentValidator = (data) => {
  const { date, timeBlockId } = data;

  if (date === undefined && timeBlockId === undefined) {
    const error = new Error(
      "Debes enviar al menos un campo para actualizar (date o timeBlockId)",
    );
    error.statusCode = 400;
    throw error;
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