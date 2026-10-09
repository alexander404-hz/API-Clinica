const AppError = require("../utils/AppError");

const { VALID_ROLES } = require("../constants/roles");
const { fieldChecker } = require("./validatorUtils");
const { VALIDATION_ERROR } = require("../constants/errorCodes");

const {
  validateIsoDateRange,
  validateString,
  validateBoolean,
} = require("./commonValidator");

const NAME_PATTERN = /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const validateRole = (value) => {
  const result = validateString(value, "Role");
  if (result.error || result.value === undefined) return result;

  const role = result.value.toUpperCase();

  if (!VALID_ROLES.includes(role)) {
    return { error: `Role must be one of: ${VALID_ROLES.join(", ")}.` };
  }

  return { value: role };
};

exports.checkUserFieldsToCreate = (body, check) => {
  const { firstName, lastName, email } = body;

  check("firstName", validateName(firstName, "First name", true));
  check("lastName", validateName(lastName, "Last name", true));
  check("email", validateEmail(email, true));
};

exports.checkUserFieldsToFilter = (query, check) => {
  const {
    firstName,
    lastName,
    email,
    username,
    isActive,
    createdFrom,
    createdTo,
    updatedFrom,
    updatedTo,
  } = query;

  check("firstName", validateName(firstName, "First name"));
  check("lastName", validateName(lastName, "Last name"));
  check("username", validateString(username, "Username"));
  check("email", validateEmail(email, "Email"));
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
};

exports.listUsersValidator = (query) => {
  const { search, role } = query;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  check("search", validateString(search, "Search"));
  exports.checkUserFieldsToFilter(query, check);
  check("role", validateRole(role));

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
