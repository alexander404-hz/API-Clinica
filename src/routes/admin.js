const { Router } = require("express");
const router = Router();

const authenticateToken = require("../middlewares/auth");

const {
  createTimeBlock,
  listAppointments,
} = require("../controllers/adminController");

router.post("/time-blocks", authenticateToken, createTimeBlock);
router.get("/appointments", authenticateToken, listAppointments);

module.exports = router;
