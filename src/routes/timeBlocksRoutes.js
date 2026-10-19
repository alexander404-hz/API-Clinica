const { Router } = require("express");
const router = Router();

const { Role } = require("../prisma");
const { ADMIN } = Role;

const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");

const { idParamValidator } = require("../validators/validatorUtils");

const {
  createTimeBlockValidator,
  updateTimeBlockValidator,
  listAvailableTimeBlocksValidator,
  generateTimeBlocksValidator,
} = require("../validators/timeBlockValidator");

const {
  listAvailableTimeBlocks,
  createTimeBlock,
  getTimeBlock,
  listTimeBlocks,
  updateTimeBlock,
  deleteTimeBlock,
  generateTimeBlocks,
} = require("../controllers/timeBlockController");

router.get(
  "/available",
  validate(listAvailableTimeBlocksValidator, "query"),
  listAvailableTimeBlocks,
);

router.post(
  "/generate",
  authorize(ADMIN),
  validate(generateTimeBlocksValidator, "body"),
  generateTimeBlocks,
);

router.post(
  "/",
  authorize(ADMIN),
  validate(createTimeBlockValidator, "body"),
  createTimeBlock,
);

router.get("/:id", validate(idParamValidator, "params"), getTimeBlock);

router.get("/", listTimeBlocks);

router.patch(
  "/:id",
  authorize(ADMIN),
  validate(idParamValidator, "params"),
  validate(updateTimeBlockValidator, "body"),
  updateTimeBlock,
);

router.delete(
  "/:id",
  validate(idParamValidator, "params"),
  authorize(ADMIN),
  deleteTimeBlock,
);

module.exports = router;
