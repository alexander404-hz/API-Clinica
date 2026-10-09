const prisma = require("../prisma");

const {
  createAppointmentValidator,
  appointmentIdValidator,
  updateAppointmentValidator,
  listAppointmentsValidator,
} = require("../validators/appointmentValidator");

const {
  SAFE_USER_SELECT,
  getScopeByRole,
  checkTimeConflict,
  ensureTimeBlockExist,
  ensurePatientExist,
  checkAppointment,
} = require("../helpers/appointmentHelpers");

exports.createAppointmentService = async (data, user) => {
  const { date, timeBlockId, patientId } = createAppointmentValidator(
    data,
    user,
  );

  await Promise.all([
    await ensureTimeBlockExist(timeBlockId),
    await ensurePatientExist(patientId),
  ]);

  await checkTimeConflict(date, timeBlockId);

  const newAppointment = await prisma.appointment.create({
    data: { date, timeBlockId, patientId },
  });

  return newAppointment;
};

exports.listAppointmentsService = async (user, query) => {
  const scope = getScopeByRole(user);
  const filters = listAppointmentsValidator(query, user);

  const where = { ...filters, ...scope };

  const appointments = await prisma.appointment.findMany({
    where,
    select: {
      id: true,
      date: true,
      timeBlock: true,
      patient: {
        select: { user: { select: SAFE_USER_SELECT }, insuranceNumber: true },
      },
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
      patientId: true,
      timeBlockId: true,
      patient: {
        select: { user: { select: SAFE_USER_SELECT }, insuranceNumber: true },
      },
      timeBlock: true,
    },
  });

  checkAppointment(appointment, user);

  const { patientId, timeBlockId, ...safeAppointment } = appointment;

  return safeAppointment;
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
      patientId: true,
    },
  });

  checkAppointment(currentAppointment, user);

  const deletedAppointment = await prisma.appointment.delete({
    where: { id },
  });

  return deletedAppointment;
};
