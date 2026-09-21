const { PrismaClient } = require("../../generated/prisma");
const prisma = new PrismaClient();

exports.SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
};

exports.getScopeByRole = (user) => {
  const scopes = {
    ADMIN: {},
    PATIENT: { userId: user.id },
  };

  return scopes[user.role] ?? { userId: user.id };
};

exports.checkTimeConflict = async (date, timeBlockId, excludedId = null) => {
  const where = { date, timeBlockId };

  if (excludedId) where.id = { not: excludedId };

  const conflict = await prisma.appointment.findFirst({ where });

  if (conflict) {
    const error = new Error("El horario no esta disponible");
    error.statusCode = 409;
    throw error;
  }
};

exports.ensureTimeBlockExist = async (timeBlockId) => {
  const timeBlock = await prisma.timeBlock.findUnique({
    where: { id: timeBlockId },
  });

  if (!timeBlock) {
    const error = new Error("El bloque de horario no existe");
    error.statusCode = 400;
    throw error;
  }

  return timeBlock;
};

exports.ensurePatientExist = async (id) => {
  const patient = await prisma.user.findUnique({
    where: { id },
  });

  if (!patient) {
    const error = new Error(
      "No se pudo crear la cita, verifica los datos enviados",
    );
    error.statusCode = 400;
    throw error;
  }

  return patient;
};

exports.checkAppointment = (appointment, user) => {
  if (
    !appointment ||
    (user.role === "PATIENT" && appointment.userId !== user.id)
  ) {
    const error = new Error("Cita no encontrada");
    error.statusCode = 404;
    throw error;
  }
};
