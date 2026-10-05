const { Router } = require("express");
const router = Router();

const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const { createAdminValidator } = require("../validators/adminValidator");

const {
  ROLES: { ADMIN },
} = require("../constants/roles");

const {
  createAdmin,
  createTimeBlock,
  listAppointments,
} = require("../controllers/adminController");

router.use(authorize(ADMIN));

router.post("/", validate(createAdminValidator, "body"), createAdmin);
router.post("/time-blocks", createTimeBlock);
router.get("/appointments", listAppointments);

module.exports = router;
