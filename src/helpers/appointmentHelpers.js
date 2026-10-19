const AppError = require("../utils/AppError");

const { Role, AppointmentStatus } = require("../prisma");
const { PATIENT, ADMIN } = Role;
const { NO_SHOW } = AppointmentStatus;

const { CONFLICT } = require("../constants/errorCodes");
const { VALIDATION_ERROR, FORBIDDEN } = require("../constants/errorCodes");
const { MS_PER_HOUR } = require("../constants/config");
const { flattenUser } = require("./userHelpers");
const { getClinicDayRange, getClinicDateOf } = require("./commonHelpers");

const {
  APPOINTMENT_BASE_SELECT,
  APPOINTMENT_DETAILS_SELECT,
  MIN_CANCEL_NOTICE_HOURS,
  MIN_CANCEL_NOTICE_DAYS,
  ALLOWED_TRANSITIONS,
} = require("../constants/appointment");

const {
  listAvailableTimeBlocksService,
} = require("../services/timeBlockService");

exports.assertAvailableTimeBlock = async (startsAt, endsAt, currentUser) => {
  const date = getClinicDateOf(startsAt);
  const availableTimeBlocks = await listAvailableTimeBlocksService(
    date,
    currentUser,
  );

  const isAvailable = availableTimeBlocks.some(
    (block) =>
      block.startsAt.getTime() === startsAt.getTime() &&
      block.endsAt.getTime() === endsAt.getTime(),
  );

  if (!isAvailable) {
    throw new AppError(
      `The selected time block is not available.`,
      409,
      CONFLICT,
    );
  }
};

exports.resolvePatientId = async (requestedPatientId, currentUser) => {
  const patientId =
    currentUser.role === PATIENT ? currentUser.id : requestedPatientId;

  if (!patientId) {
    throw new AppError("Validation failed.", 400, VALIDATION_ERROR, [
      { field: "patientId", message: "Patient Id is required." },
    ]);
  }

  return patientId;
};

exports.serializeAppointment = (appointment) => {
  const {
    id,
    patient,
    startsAt,
    endsAt,
    status,
    statusChangedAt,
    statusChangedBy,
    createdAt,
  } = appointment;

  return {
    id,
    patient: patient && flattenUser(patient),
    startsAt,
    endsAt,
    status,
    statusChangedAt,
    statusChangedBy,
    createdAt,
  };
};

exports.ownerFilter = (currentUser) =>
  currentUser.role === PATIENT ? { patientId: currentUser.id } : {};

exports.selectFor = (currentUser) =>
  currentUser.role === PATIENT
    ? APPOINTMENT_BASE_SELECT
    : APPOINTMENT_DETAILS_SELECT;

exports.assertValidTransition = (from, to) => {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new AppError(
      `Cannot change status from ${from} to ${to}.`,
      409,
      CONFLICT,
    );
  }
};

exports.assertCanCorrectNoShow = (status, currentUser) => {
  if (status === NO_SHOW && currentUser.role !== ADMIN) {
    throw new AppError("Only an admin can correct a no-show.", 403, FORBIDDEN);
  }
};

exports.assertCancellationWindowOpen = (appointment, now) => {
  const remainingHours = (appointment.startsAt - now) / MS_PER_HOUR;

  if (remainingHours < MIN_CANCEL_NOTICE_HOURS) {
    throw new AppError(
      `Appointments must be cancelled at least ${MIN_CANCEL_NOTICE_HOURS} hours (${MIN_CANCEL_NOTICE_DAYS} days) in advance.`,
      409,
      CONFLICT,
    );
  }
};

exports.assertAppointmentDayStarted = (appointment, now = new Date()) => {
  const { dayStart } = getClinicDayRange(getClinicDateOf(appointment.startsAt));

  if (now < dayStart) {
    throw new AppError(
      "The appointment day has not started yet.",
      409,
      CONFLICT,
    );
  }
};
