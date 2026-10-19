const { Router } = require("express");
const router = Router();

const { Role } = require("../prisma");
const { ADMIN } = Role;

const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const allowFields = require("../middlewares/allowFields");

const { idParamValidator } = require("../validators/validatorUtils");
const { USER_EDITABLE_FIELDS } = require("../constants/user");
const { listLimiter } = require("../middlewares/rateLimiters");

const {
  listUsersValidator,
  updateUserValidator,
} = require("../validators/userValidator");

const {
  getMyProfile,
  updateMyProfile,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

router.get("/me", getMyProfile);

router.patch(
  "/me",
  allowFields(USER_EDITABLE_FIELDS),
  validate(updateUserValidator, "body"),
  updateMyProfile,
);

router.get(
  "/",
  listLimiter,
  authorize(ADMIN),
  validate(listUsersValidator, "query"),
  listUsers,
);

router.get(
  "/:id",
  authorize(ADMIN),
  validate(idParamValidator, "params"),
  getUser,
);

router.patch(
  "/:id",
  authorize(ADMIN),
  validate(idParamValidator, "params"),
  validate(updateUserValidator, "body"),
  updateUser,
);

router.delete(
  "/:id",
  validate(idParamValidator, "params"),
  authorize(ADMIN),
  deleteUser,
);

module.exports = router;
