const { Router } = require("express");
const { authorize } = require("../middlewares/authorize");
const {
  createAppointment,
  listAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
} = require("../controllers/appointmentController");

const router = Router();

router.post("/", authorize("PATIENT", "ADMIN"), createAppointment);
router.get("/", authorize("PATIENT", "ADMIN"), listAppointments);
router.get("/:id", authorize("PATIENT", "ADMIN"), getAppointment);
router.patch("/:id", authorize("PATIENT", "ADMIN"), updateAppointment);
router.delete("/:id", authorize("ADMIN"), deleteAppointment);

module.exports = router;
