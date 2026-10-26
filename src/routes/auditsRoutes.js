const { Router } = require("express");
const router = Router();

const { Role } = require("../prisma");
const { ADMIN } = Role;

const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const auditReads = require("../utils/auditReads");
const { listLimiter } = require("../middlewares/rateLimiters");

const {
  listReadsLogsValidator,
  listChangesLogsValidator,
} = require("../validators/auditValidator");

const {
  listReadsLogs,
  listChangesLogs,
} = require("../controllers/auditController");

router.use(authorize(ADMIN));

router.get(
  "/reads-logs",
  listLimiter,
  validate(listReadsLogsValidator, "query"),
  auditReads("ReadsLog"),
  listReadsLogs,
);

router.get(
  "/changes-logs",
  listLimiter,
  validate(listChangesLogsValidator, "query"),
  auditReads("ChangeLog"),
  listChangesLogs,
);

module.exports = router;
