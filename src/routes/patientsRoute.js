const { Router } = require("express");
const router = Router();

const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const allowFields = require("../middlewares/allowFields");

const { idParamValidator } = require("../validators/validatorUtils");
const { SELF_PATIENT_EDITABLE_FIELDS } = require("../constants/patient");

const {
  ROLES: { ADMIN, PATIENT },
} = require("../constants/roles");

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
  allowFields(SELF_PATIENT_EDITABLE_FIELDS),
  validate(updatePatientValidator, "body"),
  updateMyProfile,
);

router.post(
  "/",
  authorize(ADMIN),
  validate(createPatientValidator, "body"),
  createPatient,
);

router.get(
  "/",
  authorize(ADMIN),
  validate(listPatientsValidator, "query"),
  listPatients,
);

router.get(
  "/:id",
  authorize(ADMIN),
  validate(idParamValidator, "params"),
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
