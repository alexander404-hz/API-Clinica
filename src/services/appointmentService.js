const { prisma, Role, AppointmentStatus } = require("../prisma");
const { PATIENT } = Role;
const { CANCELLED, SCHEDULED, COMPLETED, NO_SHOW } = AppointmentStatus;

const { APPOINTMENT_BASE_SELECT } = require("../constants/appointment");
const { getPatientService } = require("./patientService");
const { withAudit } = require("../utils/whithAudit");

const {
  assertFound,
  buildRangeFilter,
  contains,
  getClinicDayRange,
  getClinicDateOf,
} = require("../helpers/commonHelpers");

const {
  assertAvailableTimeBlock,
  resolvePatientId,
  serializeAppointment,
  ownerFilter,
  assertCancellationWindowOpen,
  selectFor,
  assertValidTransition,
  assertAppointmentDayStarted,
  assertCanCorrectNoShow,
} = require("../helpers/appointmentHelpers");

exports.createAppointmentService = async (data, currentUser, ip) => {
  const { startsAt, endsAt } = data;

  await assertAvailableTimeBlock(startsAt, endsAt, currentUser);

  const patientId = await resolvePatientId(data.patientId, currentUser);
  await getPatientService(patientId);

  const actor = { id: currentUser.id, ip };

  const newAppointment = await withAudit(actor, async (tx) => {
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
    select: selectFor(currentUser),
  });

  assertFound(appointment, "Appointment");

  return serializeAppointment(appointment);
};

exports.listAppointmentsService = async (query, currentUser) => {
  const {
    search,
    startsFrom,
    startsTo,
    endsFrom,
    endsTo,
    status,
    statusChangedFrom,
    statusChangedTo,
    statusChangedById,
    patientId,
    createdFrom,
    createdTo,
  } = query;

  const startsAt = buildRangeFilter(startsFrom, startsTo);
  const endsAt = buildRangeFilter(endsFrom, endsTo);
  const statusChangedAt = buildRangeFilter(statusChangedFrom, statusChangedTo);
  const createdAt = buildRangeFilter(createdFrom, createdTo);

  const isPatient = currentUser.role === PATIENT;

  const conditions = [];
  const words = !isPatient && search ? search.split(/\s+/).slice(0, 5) : [];

  for (const word of words) {
    conditions.push({
      patient: {
        OR: [
          { user: { firstName: contains(word) } },
          { user: { lastName: contains(word) } },
          { user: { username: contains(word) } },
          { user: { email: contains(word) } },
          { insuranceNumber: contains(word) },
          { preferredName: contains(word) },
        ],
      },
    });
  }

  const ownerFilter = isPatient
    ? { patientId: currentUser.id }
    : patientId && { patientId };

  const appointments = await prisma.appointment.findMany({
    where: {
      ...ownerFilter,
      ...(startsAt && { startsAt }),
      ...(endsAt && { endsAt }),
      ...(status && { status }),
      ...(statusChangedAt && { statusChangedAt }),
      ...(!isPatient && statusChangedById && { statusChangedById }),
      ...(createdAt && { createdAt }),
      ...(conditions.length > 0 && { AND: conditions }),
    },
    select: selectFor(currentUser),
    orderBy: { startsAt: "desc" },
    take: 100,
  });

  return appointments.map(serializeAppointment);
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

  const updated = await withAudit(actor, async (tx) => {
    return await tx.appointment.update({
      where: { id, status: from, ...ownerFilter(currentUser) },
      data: { status, statusChangedAt: now, statusChangedById: currentUser.id },
      select: selectFor(currentUser),
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

  const { count } = await withAudit(actor, async (tx) => {
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
