const AppError = require("../utils/AppError");

const { VALID_REPLACE } = require("../constants/timeblock");
const { VALIDATION_ERROR } = require("../constants/errorCodes");
const { TIME_PATTERN } = require("../constants/pattern");
const { fieldChecker } = require("./validatorUtils");

const {
  validateDate,
  validateList,
  validateString,
} = require("./commonValidator");

const validateTime = (value, label = "Time", required = false) => {
  const result = validateString(value, label, required);
  if (result.error || result.value === undefined) return result;

  const time = result.value;

  if (!TIME_PATTERN.test(time)) {
    return {
      error: `${label} must follow HH:mm format (24h).`,
    };
  }

  const dateTime = new Date(`1970-01-01T${time}:00Z`);

  return { value: dateTime };
};

const validateTimeRange = (
  startTime,
  endTime,
  startLabel = "Start Time",
  endLabel = "End time",
  required = false,
  { allowEqual = false } = {},
) => {
  const start = validateTime(startTime, startLabel, required);
  const end = validateTime(endTime, endLabel, required);

  if (start.value && end.value) {
    const isInvalid = allowEqual
      ? start.value > end.value
      : start.value >= end.value;

    if (isInvalid) {
      return {
        start,
        end: { error: `${endLabel} must be later than ${startLabel}.` },
      };
    }
  }

  return { start, end };
};

const validateGenerateTimes = (
  startTime,
  endTime,
  durationTime,
  durationLabel = "Duration",
  required = false,
) => {
  const { start, end } = validateTimeRange(
    startTime,
    endTime,
    "Start Time",
    "End Time",
    required,
  );

  const duration = validateTime(durationTime, durationLabel, required);

  const minutesBetweenStartEnd = (end.value - start.value) / (1000 * 60);
  const minutesDuration = duration.value / (1000 * 60);

  if (minutesDuration > minutesBetweenStartEnd) {
    return {
      start,
      end,
      duration: {
        error:
          "The duration must be less than the time elapsed between the start time and the end time.",
      },
    };
  }

  return { start, end, duration };
};

exports.createTimeBlockValidator = (body) => {
  const { startTime, endTime } = body;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  const time = validateTimeRange(
    startTime,
    endTime,
    "Start Time",
    "End Time",
    true,
  );

  check("startTime", time.start);
  check("endTime", time.end);

  if (errors.length > 0) {
    throw new AppError("Validation failed", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};

exports.updateTimeBlockValidator = (body) => {
  const { startTime, endTime } = body;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  const time = validateTimeRange(startTime, endTime, "Start Time", "End Time");

  check("startTime", time.start);
  check("endTime", time.end);

  if (errors.length > 0) {
    throw new AppError("Validation failed.", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};

exports.listAvailableTimeBlocksValidator = (query) => {
  const { date } = query;

  const result = validateDate(date, "Date", true);

  if (result.error) {
    throw new AppError("Validation failed.", 400, VALIDATION_ERROR, [
      { field: "date", message: result.error },
    ]);
  }

  return { date: result.value };
};

exports.generateTimeBlocksValidator = (body) => {
  const { startTime, endTime, duration, clear, replace } = body;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  const times = validateGenerateTimes(startTime, endTime, duration, true);

  check("startTime", times.start);
  check("endTime", times.end);
  check("duration", times.duration);
  check("replace", validateList(replace, "Replace", VALID_REPLACE));

  if (errors.length > 0) {
    throw new AppError("Validation failed", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};
