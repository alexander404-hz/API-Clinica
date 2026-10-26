const { MAX_SEARCH_WORDS } = require("../constants/config");
const { MAX_PAGINATE_LIMIT } = require("../constants/config");

const {
  DATE_PATTERN,
  ISO_DATE_PATTERN,
  ISO_DATE_TIME_PATTERN,
} = require("../constants/pattern");

function isValidCalendarDate(year, month, day) {
  const check = new Date(Date.UTC(year, month - 1, day));

  return (
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day
  );
}

exports.validateString = (
  value,
  label = "Field",
  required = false,
  max = 50,
  isAPassword = false,
) => {
  if (value === undefined || value === null) {
    return required ? { error: `${label} is required.` } : { value: undefined };
  }

  if (typeof value !== "string") {
    return { error: `${label} must be a text value.` };
  }

  const text = isAPassword ? value : value.trim();

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

function validateIntegerValue(value, label, max) {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    return { error: `${label} must be an integer.` };
  }

  if (value < 1) {
    return { error: `${label} must be a positive integer.` };
  }

  if (value > max) {
    return { error: `${label} must be at most ${max}.` };
  }

  return { value };
}

exports.validateInteger = (
  value,
  label = "Field",
  required = false,
  max = Number.MAX_SAFE_INTEGER,
) => {
  if (value === undefined || value === null) {
    return required ? { error: `${label} is required.` } : { value: undefined };
  }

  const int = validateIntegerValue(value, label, max);

  return int;
};

exports.validateIntegerParam = (
  value,
  label = "Field",
  required = false,
  max = Number.MAX_SAFE_INTEGER,
) => {
  const result = exports.validateString(value, label, required);
  if (result.error || result.value === undefined) return result;

  const int = validateIntegerValue(Number(result.value), label, max);

  return int;
};

exports.validateSearch = (value, label = "Search") => {
  const result = exports.validateString(value, label, false);
  if (result.error || result.value === undefined) return result;

  if (result.value.includes(",")) {
    return {
      error: `${label} cannot contain commas. Separate words with spaces.`,
    };
  }

  const words = result.value.split(/\s+/);

  if (words.length > MAX_SEARCH_WORDS) {
    return { error: `${label} accepts at most ${MAX_SEARCH_WORDS} words.` };
  }

  return { value: words };
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

exports.validateList = (value, label, list, required = false) => {
  const result = exports.validateString(value, label, required);
  if (result.error || result.value === undefined) return result;

  const match = list.find(
    (option) => option.toUpperCase() === result.value.toUpperCase(),
  );

  if (!match) {
    return { error: `${label} must be one of: ${list.join(", ")}.` };
  }

  return { value: match };
};

exports.validateMultiList = (value, label, list, required = false) => {
  if (Array.isArray(value)) {
    return {
      error: `${label} must be sent once, with values separated by commas.`,
    };
  }

  const maxLength = list.join(", ").length * 2;

  const result = exports.validateString(value, label, required, maxLength);
  if (result.error || result.value === undefined) return result;

  const requested = result.value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");

  if (requested.length === 0) {
    return required
      ? { error: `${label} cannot be empty.` }
      : { value: undefined };
  }

  const selected = [];
  const invalid = [];

  for (const item of requested) {
    const match = list.find(
      (option) => option.toUpperCase() === item.toUpperCase(),
    );

    if (!match) {
      invalid.push(item);
    } else if (!selected.includes(match)) {
      selected.push(match); // sin duplicados, con el valor original de la lista
    }
  }

  if (invalid.length > 0) {
    return {
      error: `${label} has invalid values (${invalid.join(", ")}). Allowed: ${list.join(", ")}.`,
    };
  }

  return { value: selected };
};

function validatePatternedDate(value, label, pattern, example, required) {
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

exports.validateDate = (value, label = "Date", required = false) =>
  validatePatternedDate(value, label, DATE_PATTERN, "YYYY-MM-DD", required);

exports.validateIsoDate = (value, label = "ISO Date", required = false) =>
  validatePatternedDate(
    value,
    label,
    ISO_DATE_PATTERN,
    "YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ (ISO 8601)",
    required,
  );

exports.validateIsoDateTime = (
  value,
  label = "ISO Date Time",
  required = false,
) =>
  validatePatternedDate(
    value,
    label,
    ISO_DATE_TIME_PATTERN,
    "YYYY-MM-DDTHH:mm:ssZ or YYYY-MM-DDTHH:mm:ss-06:00 (ISO 8601)",
    required,
  );

function buildDateRangeValidator(validate, adjustTo) {
  return (
    fromDate,
    toDate,
    fromLabel = "From Date",
    toLabel = "To Date",
    required = false,
  ) => {
    const from = validate(fromDate, fromLabel, required);
    const to = validate(toDate, toLabel, required);

    if (adjustTo) adjustTo(to, toDate);

    if (from.value && to.value && from.value > to.value) {
      return {
        from,
        to: { error: `${toLabel} cannot be earlier than ${fromLabel}.` },
      };
    }

    return { from, to };
  };
}

exports.validateDateRange = buildDateRangeValidator(exports.validateDate);

exports.validateIsoDateRange = buildDateRangeValidator(
  exports.validateIsoDate,
  (to, toRaw) => {
    if (to.value && toRaw.length === 10) {
      to.value.setUTCHours(23, 59, 59, 999);
    }
  },
);

exports.validateIsoDateTimeRange = buildDateRangeValidator(
  exports.validateIsoDateTime,
);

exports.validateLimit = (value, label = "Limit", max = MAX_PAGINATE_LIMIT) => {
  const result = exports.validateIntegerParam(value, label, false, max);
  if (result.error || result.value === undefined) return result;

  return result;
};
