const { Router } = require("express");
const router = Router();

const authenticateToken = require("../middlewares/auth");

const {
  createAppointment,
  getAppointment,
  updateAppointment,
  deleteAppointment,
} = require("../controllers/appointmentController");

router.post("/", authenticateToken, createAppointment);
router.get("/:id", authenticateToken, getAppointment);
router.patch("/:id", authenticateToken, updateAppointment);
router.delete("/:id", authenticateToken, deleteAppointment);

module.exports = router;
