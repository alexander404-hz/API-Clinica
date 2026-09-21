const { Router } = require("express");
const router = Router();

const { authorize } = require("../middlewares/authorize");

const {
  createTimeBlock,
  listAppointments,
} = require("../controllers/adminController");

router.use(authorize("ADMIN"));

router.post("/time-blocks", createTimeBlock);
router.get("/appointments", listAppointments);

module.exports = router;
