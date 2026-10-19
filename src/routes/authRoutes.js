const { Router } = require("express");
const router = Router();

const validate = require("../middlewares/validate");
const { resolveAccount } = require("../middlewares/resolveAccount");
const { authenticateToken } = require("../middlewares/authenticate");

const {
  registerPatient,
  login,
  changePassword,
} = require("../controllers/authController");

const {
  registerPatientValidator,
  loginValidator,
  changePasswordValidator,
} = require("../validators/authValidator");

const {
  registerIpLimiter,
  registerEmailLimiter,
  loginIpLimiter,
  loginAccountLimiter,
  authFailLimiter,
  userLimiter,
  changePasswordLimiter,
} = require("../middlewares/rateLimiters");

router.post(
  "/register",
  registerIpLimiter,
  validate(registerPatientValidator, "body"),
  registerEmailLimiter,
  registerPatient,
);

router.post(
  "/login",
  loginIpLimiter,
  validate(loginValidator, "body"),
  resolveAccount,
  loginAccountLimiter,
  login,
);

router.post(
  "/change-password",
  authFailLimiter,
  authenticateToken,
  userLimiter,
  changePasswordLimiter,
  validate(changePasswordValidator, "body"),
  changePassword,
);

module.exports = router;
