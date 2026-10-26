const AppError = require("../utils/AppError");

const { VALIDATION_ERROR } = require("../constants/errorCodes");
const { VALID_APPOINTMENT_STATUS } = require("../constants/appointment");
const { fieldChecker } = require("./validatorUtils");

const {
  validateInteger,
  validateIsoDateRange,
  validateIntegerParam,
  validateIsoDateTimeRange,
  validateMultiList,
  validateSearch,
  validateLimit,
} = require("./commonValidator");

exports.createAppointmentValidator = (body) => {
  const { startsAt, endsAt, patientId } = body;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  const dateTime = validateIsoDateTimeRange(
    startsAt,
    endsAt,
    "Starts At",
    "Ends At",
    true,
  );

  check("startsAt", dateTime.from);
  check("endsAt", dateTime.to);

  check("patientId", validateInteger(patientId, "Patient Id"));

  if (errors.length > 0) {
    throw new AppError("Validation failed", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};

exports.listAppointmentsValidator = (query) => {
  const { search, startsFrom, startsTo, endsFrom, endsTo, status } = query;
  const { statusChangedFrom, statusChangedTo, statusChangedById } = query;
  const { patientId, createdFrom, createdTo, limit, cursor } = query;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  check("search", validateSearch(search));

  const starts = validateIsoDateRange(
    startsFrom,
    startsTo,
    "Starts From",
    "Starts To",
  );

  check("startsFrom", starts.from);
  check("startsTo", starts.to);

  const ends = validateIsoDateRange(endsFrom, endsTo, "Ends From", "Ends To");

  check("endsFrom", ends.from);
  check("endsTo", ends.to);

  check(
    "status",
    validateMultiList(status, "Status", VALID_APPOINTMENT_STATUS),
  );

  const statusChanged = validateIsoDateRange(
    statusChangedFrom,
    statusChangedTo,
    "Status Changed From",
    "Status Changed To",
  );

  check("statusChangedFrom", statusChanged.from);
  check("statusChangedTo", statusChanged.to);

  check(
    "statusChangedById",
    validateIntegerParam(statusChangedById, "Status Changed By Id"),
  );
  check("patientId", validateIntegerParam(patientId, "Patient Id"));

  const created = validateIsoDateRange(
    createdFrom,
    createdTo,
    "Created From",
    "Created To",
  );

  check("createdFrom", created.from);
  check("createdTo", created.to);

  check("limit", validateLimit(limit));
  check("cursor", validateIntegerParam(cursor, "Cursor"));

  if (errors.length > 0) {
    throw new AppError("Validation failed.", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};
