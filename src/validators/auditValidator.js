const AppError = require("../utils/AppError");
const { VALIDATION_ERROR } = require("../constants/errorCodes");
const { VALID_MODEL_NAMES, VALID_READ_ACTIONS } = require("../constants/audit");
const { VALID_ROLES } = require("../constants/user");
const { fieldChecker } = require("./validatorUtils");

const {
  validateString,
  validateIntegerParam,
  validateIsoDateRange,
  validateMultiList,
  validateSearch,
  validateLimit,
  validateBoolean,
} = require("./commonValidator");

const checkAuditFieldsToFilter = (query, check) => {
  const { actorId, actorRole, action, entity, entityId } = query;
  const { ip, createdFrom, createdTo } = query;

  check("actorId", validateIntegerParam(actorId, "Actor Id"));
  check("actorRole", validateMultiList(actorRole, "Actor Role", VALID_ROLES));
  check("action", validateMultiList(action, "Action", VALID_READ_ACTIONS));
  check("entity", validateMultiList(entity, "Entity", VALID_MODEL_NAMES));
  check("entityId", validateIntegerParam(entityId, "Entity Id"));
  check("ip", validateString(ip, "ip"));

  const created = validateIsoDateRange(
    createdFrom,
    createdTo,
    "Created From",
    "Created To",
  );

  check("createdFrom", created.from);
  check("createdTo", created.to);
};

exports.listReadsLogsValidator = (query) => {
  const { search, limit, cursor } = query;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  check("search", validateSearch(search));

  checkAuditFieldsToFilter(query, check);

  check("limit", validateLimit(limit));
  check("cursor", validateIntegerParam(cursor, "Cursor"));

  if (errors.length > 0) {
    throw new AppError("Validation failed.", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};

exports.listChangesLogsValidator = (query) => {
  const { search, hasActor, limit, cursor } = query;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  check("search", validateSearch(search));

  checkAuditFieldsToFilter(query, check);
  check("hasActor", validateBoolean(hasActor, "Has actor"));

  check("limit", validateLimit(limit));
  check("cursor", validateIntegerParam(cursor, "Cursor"));

  if (errors.length > 0) {
    throw new AppError("Validation failed.", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};
