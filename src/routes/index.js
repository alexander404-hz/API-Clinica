const { Router } = require("express");
const authRouter = require("./authRoutes");
const usersRouter = require("./usersRoutes");
const patientsRouter = require("./patientsRoute");
const adminsRouter = require("./adminsRoutes");
const appointmentsRouter = require("./appointmentsRoutes");
const { authenticateToken } = require("../middlewares/auth");

const router = Router();

router.use("/auth", authRouter);

router.use(authenticateToken);

router.use("/users", usersRouter);
router.use("/admins", adminsRouter);
router.use("/patients", patientsRouter);
router.use("/appointments", appointmentsRouter);

module.exports = router;
