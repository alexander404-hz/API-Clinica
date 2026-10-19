const { Router } = require("express");
const router = Router();

const authRouter = require("./authRoutes");
const usersRouter = require("./usersRoutes");
const patientsRouter = require("./patientsRoute");
const adminsRouter = require("./adminsRoutes");
const appointmentsRouter = require("./appointmentsRoutes");
const timeBlocksRouter = require("./timeBlocksRoutes");
const { authenticateToken } = require("../middlewares/authenticate");
const { enforcePasswordChange } = require("../middlewares/enforcePassChange");
const { authFailLimiter, userLimiter } = require("../middlewares/rateLimiters");

router.use("/auth", authRouter);

router.use(authFailLimiter);

//Tráfico no autenticado (arriba)

router.use(authenticateToken);
router.use(userLimiter);
router.use(enforcePasswordChange);

router.use("/users", usersRouter);
router.use("/admins", adminsRouter);
router.use("/patients", patientsRouter);
router.use("/appointments", appointmentsRouter);
router.use("/timeBlocks", timeBlocksRouter);

module.exports = router;
