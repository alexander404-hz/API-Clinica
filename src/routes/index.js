const { Router } = require("express");
const router = Router();

const authRouter = require("./auth");
const adminRouter = require("./admin");
const appointmentsRouter = require("./appointments");

router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/appointments", appointmentsRouter);

module.exports = router;
