const { Router } = require("express");
const authRouter = require("./authRoutes");
const adminRouter = require("./adminRoutes");
const usersRouter = require("./usersRoutes");
const appointmentsRouter = require("./appointmentsRoutes");
const { authenticateToken } = require("../middlewares/auth");

const router = Router();

router.use("/auth", authRouter);

router.use(authenticateToken);

router.use("/admin", adminRouter);
router.use("/users", usersRouter);
router.use("/appointments", appointmentsRouter);

module.exports = router;
