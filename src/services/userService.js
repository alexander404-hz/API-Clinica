const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { PrismaClient } = require("../../generated/prisma");
const { PATIENT } = require("../constants/roles");
const { SALT_ROUNDS } = require("../constants/security");

const {
  createUserValidator,
  appointmentIdValidator,
  updateAppointmentValidator,
  listAppointmentsValidator,
} = require("../validators/userValidator");

const {
  SAFE_USER_SELECT,
  generateUsername,
} = require("../helpers/userHelpers");

const prisma = new PrismaClient();

exports.prepareNewUserService = async (data) => {
  const { firstName, lastName, email } = createUserValidator(data);

  const username = await generateUsername(firstName, lastName);
  const tempPassword = crypto.randomBytes(4).toString("base64url");
  const password = await bcrypt.hash(tempPassword, SALT_ROUNDS);

  const preparedNewUser = {
    tempPassword,
    userData: {
      firstName,
      lastName,
      username,
      email,
      password,
    },
  };

  return preparedNewUser;
};

/* 
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
 */
