const { Router } = require("express");
const router = Router();

const authRouter = require("./authRoutes");
const usersRouter = require("./usersRoutes");
const patientsRouter = require("./patientsRoute");
const adminsRouter = require("./adminsRoutes");
const appointmentsRouter = require("./appointmentsRoutes");
const timeBlocksRouter = require("./timeBlocksRoutes");
const auditsRouter = require("./auditsRoutes");
const { authenticateToken } = require("../middlewares/authenticate");
const { enforcePasswordChange } = require("../middlewares/enforcePassChange");
const { authFailLimiter, userLimiter } = require("../middlewares/rateLimiters");

router.use("/auth", authRouter);

router.use(authFailLimiter);

const protect = [authenticateToken, userLimiter, enforcePasswordChange];

router.use("/users", protect, usersRouter);
router.use("/admins", protect, adminsRouter);
router.use("/patients", protect, patientsRouter);
router.use("/appointments", protect, appointmentsRouter);
router.use("/timeBlocks", protect, timeBlocksRouter);
router.use("/audit", protect, auditsRouter);

module.exports = router;
