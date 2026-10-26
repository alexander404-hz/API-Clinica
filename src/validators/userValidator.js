const AppError = require("../utils/AppError");

const { VALID_ROLES, VALID_DELETED } = require("../constants/user");
const { VALIDATION_ERROR } = require("../constants/errorCodes");
const { NAME_PATTERN, EMAIL_PATTERN } = require("../constants/pattern");
const { fieldChecker } = require("./validatorUtils");

const {
  validateIsoDateRange,
  validateString,
  validateBoolean,
  validateList,
  validateMultiList,
  validateSearch,
  validateLimit,
  validateIntegerParam,
} = require("./commonValidator");

const validateName = (value, label = "Name", required = false) => {
  const result = validateString(value, label, required);
  if (result.error || result.value === undefined) return result;

  const name = result.value.replace(/\s+/g, " ");

  if (!NAME_PATTERN.test(name)) {
    return {
      error: `${label} can only contain letters, spaces, hyphens and apostrophes.`,
    };
  }

  return { value: name };
};

const validateEmail = (value, required = false) => {
  const result = validateString(value, "Email", required, 254);
  if (result.error || result.value === undefined) return result;

  const email = result.value.toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Email must have a valid format." };
  }

  return { value: email };
};

exports.checkUserFieldsToCreate = (body, check) => {
  const { firstName, lastName, email } = body;

  check("firstName", validateName(firstName, "First name", true));
  check("lastName", validateName(lastName, "Last name", true));
  check("email", validateEmail(email, true));
};

exports.checkUserFieldsToFilter = (query, check) => {
  const { firstName, lastName, email, username, isActive } = query;
  const { createdFrom, createdTo, updatedFrom, updatedTo, deleted } = query;

  check("firstName", validateName(firstName, "First name"));
  check("lastName", validateName(lastName, "Last name"));
  check("username", validateString(username, "Username"));
  check("email", validateString(email, "Email"));
  check("isActive", validateBoolean(isActive, "Is Active"));

  const created = validateIsoDateRange(
    createdFrom,
    createdTo,
    "Created From",
    "Created To",
  );

  check("createdFrom", created.from);
  check("createdTo", created.to);

  const updated = validateIsoDateRange(
    updatedFrom,
    updatedTo,
    "Updated From",
    "Updated To",
  );

  check("updatedFrom", updated.from);
  check("updatedTo", updated.to);

  check("deleted", validateList(deleted, "Deleted", VALID_DELETED));
};

exports.listUsersValidator = (query) => {
  const { search, role, limit, cursor } = query;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  check("search", validateSearch(search));

  exports.checkUserFieldsToFilter(query, check);
  check("role", validateMultiList(role, "Role", VALID_ROLES));

  check("limit", validateLimit(limit));
  check("cursor", validateIntegerParam(cursor, "Cursor"));

  if (errors.length > 0) {
    throw new AppError("Validation failed.", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};

exports.checkUserFieldsToUpdate = (body, check) => {
  const { firstName, lastName, email, isActive } = body;

  check("firstName", validateName(firstName, "First name"));
  check("lastName", validateName(lastName, "Last name"));
  check("email", validateEmail(email));
  check("isActive", validateBoolean(isActive, "Is Active"));
};

exports.updateUserValidator = (body) => {
  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  exports.checkUserFieldsToUpdate(body, check);

  if (errors.length > 0) {
    throw new AppError("Validation failed.", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};
