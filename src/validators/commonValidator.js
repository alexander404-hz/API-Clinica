const MAX_INT = 2147483647;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d))?$/;

function isValidCalendarDate(year, month, day) {
  const check = new Date(Date.UTC(year, month - 1, day));

  return (
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day
  );
}

exports.validateId = (value) => {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return { error: "Id must be a positive integer." };
  }

  const id = Number(value);
  if (id < 1 || id > MAX_INT) {
    return { error: "Id must be a positive integer." };
  }

  return { value: id };
};

exports.validateString = (
  value,
  label = "Field",
  required = false,
  max = 50,
) => {
  if (value === undefined || value === null) {
    return required ? { error: `${label} is required.` } : { value: undefined };
  }

  if (typeof value !== "string") {
    return { error: `${label} must be a text value.` };
  }

  const text = value.trim();

  if (!text) {
    return required
      ? { error: `${label} cannot be empty.` }
      : { value: undefined };
  }

  if (text.length > max) {
    return { error: `${label} must be at most ${max} characters long.` };
  }

  return { value: text };
};

exports.validateBoolean = (value, label = "Boolean", required = false) => {
  const result = exports.validateString(value, label, required);
  if (result.error || result.value === undefined) return result;

  const bool = result.value;

  if (bool !== "true" && bool !== "false") {
    return { error: `${label} must be "true" or "false".` };
  }

  return { value: bool === "true" };
};

function validateDateValue(
  value,
  label = "Date",
  required = false,
  pattern,
  example,
) {
  const result = exports.validateString(value, label, required);
  if (result.error || result.value === undefined) return result;

  const dateValue = result.value;
  const match = pattern.exec(dateValue);

  if (!match) {
    return { error: `${label} must follow this format: ${example}.` };
  }

  const [, year, month, day] = match.map(Number);

  if (!isValidCalendarDate(year, month, day)) {
    return { error: `${label} does not exist in the calendar.` };
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return { error: `${label} could not be parsed as a valid date.` };
  }

  return { value: date };
}

exports.validateDate = (value, label, required = false) =>
  validateDateValue(value, label, required, DATE_PATTERN, "YYYY-MM-DD");

exports.validateIsoDate = (value, label, required = false) =>
  validateDateValue(
    value,
    label,
    required,
    ISO_DATE_PATTERN,
    "YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ (ISO 8601)",
  );

exports.validateIsoDateRange = (
  fromDate,
  toDate,
  fromLabel = "From Date",
  toLabel = "To Date",
  required = false,
) => {
  const from = exports.validateIsoDate(fromDate, fromLabel, required);
  const to = exports.validateIsoDate(toDate, toLabel, required);

  if (to.value && toDate.length === 10) {
    to.value.setUTCHours(23, 59, 59, 999);
  }

  if (from.value && to.value && from.value > to.value) {
    return {
      from,
      to: { error: `${toLabel} cannot be earlier than ${fromLabel}.` },
    };
  }

  return { from, to };
};

exports.validateTime = (value, label = "Time", required = false) => {
  const result = exports.validateString(value, label, required);
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

exports.validateTimeRange = (
  startTime,
  endTime,
  startLabel = "Start Time",
  endLabel = "End time",
  required = false,
) => {
  const start = exports.validateTime(startTime, startLabel, required);
  const end = exports.validateTime(endTime, endLabel, required);

  if (start.value && end.value && start.value >= end.value) {
    return {
      start,
      end: { error: `${endLabel} must be later than ${startLabel}.` },
    };
  }

  return { start, end };
};
