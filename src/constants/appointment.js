const { AppointmentStatus } = require("../prisma");
const { SCHEDULED, NO_SHOW, COMPLETED, CANCELLED } = AppointmentStatus;

const { PATIENT_BASE_SELECT } = require("./patient");
const { USER_MIN_SELECT } = require("./user");

exports.MIN_CANCEL_NOTICE_HOURS = 72;
exports.MIN_CANCEL_NOTICE_DAYS = exports.MIN_CANCEL_NOTICE_HOURS / 24;
exports.NO_SHOW_GRACE_MINUTES = 15;

exports.VALID_APPOINTMENT_STATUS = Object.values(AppointmentStatus);

exports.ALLOWED_TRANSITIONS = {
  [SCHEDULED]: [COMPLETED, CANCELLED, NO_SHOW],
  [NO_SHOW]: [COMPLETED, CANCELLED],
  [COMPLETED]: [],
  [CANCELLED]: [],
};

exports.APPOINTMENT_BASE_SELECT = Object.freeze({
  id: true,
  startsAt: true,
  endsAt: true,
  status: true,
  statusChangedAt: true,
  createdAt: true,
});

exports.APPOINTMENT_DETAILS_SELECT = Object.freeze({
  ...exports.APPOINTMENT_BASE_SELECT,
  patient: { select: PATIENT_BASE_SELECT },
  statusChangedBy: { select: USER_MIN_SELECT },
});
