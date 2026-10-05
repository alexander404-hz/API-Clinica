const { Router } = require("express");
const router = Router();

const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const allowFields = require("../middlewares/allowFields");

const { idParamValidator } = require("../validators/commonValidator");
const { SELF_EDITABLE_FIELDS } = require("../constants/user");

const {
  ROLES: { ADMIN, DOCTOR },
} = require("../constants/roles");

const {
  createPatientValidator,
  listPatientsValidator,
} = require("../validators/patientValidator");

const {
  createPatient,
  listPatients,
} = require("../controllers/patientController");

/*
router.get("/me", getMyProfile); 

router.patch(
  "/me",
  allowFields(SELF_EDITABLE_FIELDS),
  validate(updateUsersValidator, "body"),
  updateMyProfile,
);

*/

router.post(
  "/",
  authorize(ADMIN),
  validate(createPatientValidator, "body"),
  createPatient,
);

router.get(
  "/",
  authorize(ADMIN, DOCTOR),
  validate(listPatientsValidator, "query"),
  listPatients,
);

router.get(
  "/:id",
  authorize(ADMIN),
  validate(idParamValidator, "params"),
  getPatient,
);

/*
router.patch(
  "/:id",
  authorize(ADMIN),
  validate(idParamValidator, "params"),
  validate(updateUsersValidator, "body"),
  updateUser,
);

router.delete(
  "/:id",
  validate(idParamValidator, "params"),
  authorize(ADMIN),
  deleteUser,
);
 */
module.exports = router;
