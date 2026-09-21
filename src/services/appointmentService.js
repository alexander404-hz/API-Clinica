const { PrismaClient } = require("../../generated/prisma");

const {
  createAppointmentValidator,
  appointmentIdValidator,
  updateAppointmentValidator,
} = require("../validators/appointmentValidator");

const {
  SAFE_USER_SELECT,
  getScopeByRole,
  checkTimeConflict,
  ensureTimeBlockExist,
  ensurePatientExist,
  checkAppointment,
} = require("../helpers/appointmentHelpers");

const prisma = new PrismaClient();

exports.createAppointmentService = async (data, user) => {
  const { date, timeBlockId, userId } = createAppointmentValidator(data, user);

  await Promise.all([
    await ensureTimeBlockExist(timeBlockId),
    await ensurePatientExist(userId),
  ]);

  await checkTimeConflict(date, timeBlockId);

  const newAppointment = await prisma.appointment.create({
    data: { date, timeBlockId },
  });

  return newAppointment;
};

exports.listAppointmentsService = async (user) => {
  const where = getScopeByRole(user);

  const appointments = await prisma.appointment.findMany({
    where,
    select: {
      id: true,
      date: true,
      timeBlock: true,
      user: { select: SAFE_USER_SELECT },
    },
  });

  return appointments;
};

exports.getAppointmentService = async (appointmentId, user) => {
  const id = appointmentIdValidator(appointmentId);

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      date: true,
      userId: true,
      timeBlockId: true,
      user: { select: SAFE_USER_SELECT },
      timeBlock: true,
    },
  });

  checkAppointment(appointment, user);

  return appointment;
};

exports.updateAppointmentService = async (appointmentId, data, user) => {
  const id = appointmentIdValidator(appointmentId);

  const oldAppointment = await prisma.appointment.findUnique({
    where: { id },
  });

  checkAppointment(oldAppointment, user);

  const newAppointment = updateAppointmentValidator(data);

  const timeBlockId = newAppointment.timeBlockId ?? oldAppointment.timeBlockId;
  const date = newAppointment.date ?? oldAppointment.date;

  if (newAppointment.timeBlockId !== undefined) {
    await ensureTimeBlockExist(timeBlockId);
  }

  await checkTimeConflict(date, timeBlockId, id);

  const updatedAppointment = await prisma.appointment.update({
    where: { id },
    data: { date, timeBlockId },
  });

  return updatedAppointment;
};

exports.deleteAppointmentService = async (appointmentId, user) => {
  const id = appointmentIdValidator(appointmentId);

  const currentAppointment = await prisma.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      date: true,
      userId: true,
    },
  });

  checkAppointment(currentAppointment, user);

  const deletedAppointment = await prisma.appointment.delete({
    where: { id },
  });

  return deletedAppointment;
};
