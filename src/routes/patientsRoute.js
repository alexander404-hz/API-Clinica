const { Router } = require("express");
const router = Router();

const { Role } = require("../prisma");
const { ADMIN, PATIENT } = Role;

const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const allowFields = require("../middlewares/allowFields");

const { PATIENT_EDITABLE_FIELDS } = require("../constants/patient");
const { idParamValidator } = require("../validators/validatorUtils");
const { auditRead } = require("../utils/readAudit");

const {
  patientCreateLimiter,
  listLimiter,
} = require("../middlewares/rateLimiters");

const {
  createPatientValidator,
  listPatientsValidator,
  updatePatientValidator,
} = require("../validators/patientValidator");

const {
  createPatient,
  listPatients,
  getPatient,
  updatePatient,
  deletePatient,
  getMyProfile,
  updateMyProfile,
} = require("../controllers/patientController");

router.get("/me", authorize(PATIENT), getMyProfile);

router.patch(
  "/me",
  authorize(PATIENT),
  allowFields(PATIENT_EDITABLE_FIELDS),
  validate(updatePatientValidator, "body"),
  updateMyProfile,
);

router.post(
  "/",
  patientCreateLimiter,
  authorize(ADMIN),
  validate(createPatientValidator, "body"),
  createPatient,
);

router.get(
  "/",
  listLimiter,
  authorize(ADMIN),
  validate(listPatientsValidator, "query"),
  auditRead("Patient"),
  listPatients,
);

router.get(
  "/:id",
  authorize(ADMIN),
  validate(idParamValidator, "params"),
  auditRead("Patient"),
  getPatient,
);

router.patch(
  "/:id",
  authorize(ADMIN),
  validate(idParamValidator, "params"),
  validate(updatePatientValidator, "body"),
  updatePatient,
);

router.delete(
  "/:id",
  validate(idParamValidator, "params"),
  authorize(ADMIN),
  deletePatient,
);

module.exports = router;
