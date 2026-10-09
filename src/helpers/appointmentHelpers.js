const prisma = require("../prisma");
const AppError = require("../utils/AppError");

exports.SAFE_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  email: true,
};

exports.getScopeByRole = (user) => {
  const scopes = {
    ADMIN: {},
    PATIENT: { patientId: user.id },
  };

  return scopes[user.role] ?? { patientId: user.id };
};

exports.checkTimeConflict = async (date, timeBlockId, excludedId = null) => {
  const where = { date, timeBlockId };

  if (excludedId) where.id = { not: excludedId };

  const conflict = await prisma.appointment.findFirst({ where });

  if (conflict) {
    throw new AppError("El horario no esta disponible", 409);
  }
};

exports.ensureTimeBlockExist = async (id) => {
  const timeBlock = await prisma.timeBlock.findUnique({
    where: { id },
  });

  if (!timeBlock) {
    throw new AppError("El bloque de horario no existe", 400);
  }

  return timeBlock;
};

exports.ensurePatientExist = async (id) => {
  const patient = await prisma.patient.findUnique({
    where: { id },
  });

  if (!patient) {
    throw new AppError(
      "No se pudo crear la cita, verifica los datos enviados",
      400,
    );
  }

  return patient;
};

exports.checkAppointment = (appointment, user) => {
  if (
    !appointment ||
    (user.role === "PATIENT" && appointment.patientId !== user.id)
  ) {
    throw new AppError("Cita no encontrada", 404);
  }
};
