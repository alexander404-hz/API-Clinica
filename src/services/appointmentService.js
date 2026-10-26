const { prisma, Role, AppointmentStatus } = require("../prisma");
const { PATIENT } = Role;
const { CANCELLED, SCHEDULED, COMPLETED, NO_SHOW } = AppointmentStatus;

const auditChanges = require("../utils/auditChanges");
const { APPOINTMENT_BASE_SELECT } = require("../constants/appointment");
const { getPatientService } = require("./patientService");
const { paginate } = require("../utils/paginate");

const {
  assertFound,
  buildRangeFilter,
  getClinicDayRange,
  getClinicDateOf,
  buildSearchConditions,
} = require("../helpers/commonHelpers");

const {
  assertAvailableTimeBlock,
  resolvePatientId,
  serializeAppointment,
  ownerFilter,
  assertCancellationWindowOpen,
  assertValidTransition,
  assertAppointmentDayStarted,
  assertCanCorrectNoShow,
  appointmentSelectFor,
} = require("../helpers/appointmentHelpers");

exports.createAppointmentService = async (data, currentUser, ip) => {
  const { startsAt, endsAt } = data;

  await assertAvailableTimeBlock(startsAt, endsAt, currentUser);

  const patientId = await resolvePatientId(data.patientId, currentUser);
  await getPatientService(patientId);

  const actor = { id: currentUser.id, ip };

  const newAppointment = await auditChanges(actor, async (tx) => {
    return await tx.appointment.create({
      data: { startsAt, endsAt, patientId },
      select: APPOINTMENT_BASE_SELECT,
    });
  });

  return newAppointment;
};

exports.getAppointmentService = async (id, currentUser) => {
  const appointment = await prisma.appointment.findUnique({
    where: {
      id,
      ...ownerFilter(currentUser),
    },
    select: appointmentSelectFor(currentUser),
  });

  assertFound(appointment, "Appointment");

  return serializeAppointment(appointment);
};

exports.listAppointmentsService = async (query, currentUser) => {
  const { search, startsFrom, startsTo, endsFrom, endsTo, status } = query;
  const { statusChangedFrom, statusChangedTo, statusChangedById } = query;
  const { patientId, createdFrom, createdTo, limit, cursor } = query;

  const isPatient = currentUser.role === PATIENT;

  const appointmentFilters = {
    startsAt: buildRangeFilter(startsFrom, startsTo),
    endsAt: buildRangeFilter(endsFrom, endsTo),
    patientId: isPatient ? currentUser.id : patientId,
    status: { in: status },
    statusChangedAt: buildRangeFilter(statusChangedFrom, statusChangedTo),
    statusChangedById: isPatient ? undefined : statusChangedById,
    createdAt: buildRangeFilter(createdFrom, createdTo),
  };

  const searchFields = [
    "patient.user.firstName",
    "patient.user.lastName",
    "patient.user.username",
    "patient.user.email",
    "patient.insuranceNumber",
    "patient.preferredName",
  ];

  const conditions = isPatient
    ? undefined
    : buildSearchConditions(search, searchFields);

  const appointments = await paginate(prisma.appointment, {
    where: {
      ...appointmentFilters,
      AND: conditions,
    },
    select: appointmentSelectFor(currentUser),
    orderBy: { startsAt: "desc" },
    limit,
    cursor,
    flatten: serializeAppointment,
  });

  return appointments;
};

const markAppointment = async (id, currentUser, status, ip) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id, ...ownerFilter(currentUser) },
    select: { startsAt: true, status: true },
  });

  assertFound(appointment, "Appointment");
  assertValidTransition(appointment.status, status);

  const now = new Date();
  const isPatient = currentUser.role === PATIENT;
  const from = appointment.status;

  assertCanCorrectNoShow(from, currentUser);

  if (status === CANCELLED) {
    if (isPatient && from === SCHEDULED) {
      assertCancellationWindowOpen(appointment, now);
    }
  } else if (status === COMPLETED && from === SCHEDULED) {
    assertAppointmentDayStarted(appointment, now);
  }

  const actor = { id: currentUser.id, ip };

  const updated = await auditChanges(actor, async (tx) => {
    return await tx.appointment.update({
      where: { id, status: from, ...ownerFilter(currentUser) },
      data: { status, statusChangedAt: now, statusChangedById: currentUser.id },
      select: appointmentSelectFor(currentUser),
    });
  });

  return serializeAppointment(updated);
};

exports.cancelAppointmentService = (id, currentUser, ip) =>
  markAppointment(id, currentUser, CANCELLED, ip);

exports.completeAppointmentService = (id, currentUser, ip) =>
  markAppointment(id, currentUser, COMPLETED, ip);

exports.closeExpiredAppointmentsService = async (now = new Date()) => {
  // Inicio del día actual en hora de la clínica: todo lo anterior ya terminó
  const { dayStart } = getClinicDayRange(getClinicDateOf(now));

  const system = await prisma.user.findUnique({
    where: { username: "system" },
    select: { id: true },
  });

  if (!system) {
    throw new Error('System user not found. Run the seed to create "system".');
  }

  const actor = { id: system.id, ip: "127.0.0.1" };

  const { count } = await auditChanges(actor, async (tx) => {
    return await tx.appointment.updateMany({
      where: { status: SCHEDULED, startsAt: { lt: dayStart } },
      data: {
        status: NO_SHOW,
        statusChangedAt: now,
        statusChangedById: system.id,
      },
    });
  });

  return count;
};
