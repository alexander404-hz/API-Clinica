const { Router } = require("express");
const router = Router();

const { Role } = require("../prisma");
const { ADMIN, PATIENT } = Role;

const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const { idParamValidator } = require("../validators/validatorUtils");
const { listLimiter } = require("../middlewares/rateLimiters");
const { auditRead } = require("../utils/readAudit");

const {
  createAppointmentValidator,
  listAppointmentsValidator,
} = require("../validators/appointmentValidator");

const {
  createAppointment,
  getAppointment,
  listAppointments,
  cancelAppointment,
  completeAppointment,
} = require("../controllers/appointmentController");

router.post(
  "/",
  authorize(PATIENT, ADMIN),
  validate(createAppointmentValidator, "body"),
  createAppointment,
);

router.get(
  "/:id",
  authorize(PATIENT, ADMIN),
  validate(idParamValidator, "params"),
  auditRead("Appointment"),
  getAppointment,
);

router.get(
  "/",
  listLimiter,
  authorize(PATIENT, ADMIN),
  validate(listAppointmentsValidator, "query"),
  auditRead("Appointment"),
  listAppointments,
);

router.post(
  "/:id/cancel",
  authorize(PATIENT, ADMIN),
  validate(idParamValidator, "params"),
  cancelAppointment,
);

router.post(
  "/:id/complete",
  authorize(ADMIN),
  validate(idParamValidator, "params"),
  completeAppointment,
);

module.exports = router;
