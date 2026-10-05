const AppError = require("../utils/AppError");

const { fieldChecker } = require("./validatorUtils");
const { VALIDATION_ERROR } = require("../constants/errorCodes");
const {
  validateName,
  validateEmail,
  validateSearchText,
  validateRole,
} = require("./fieldValidator");

exports.checkUserFields = (body, check) => {
  const { firstName, lastName, email } = body;

  check("firstName", validateName(firstName, "First name"));
  check("lastName", validateName(lastName, "Last name"));
  check("email", validateEmail(email));
};

exports.listUsersValidator = (query) => {
  const { search, firstName, lastName, username, email, role } = query;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  check("search", validateSearchText(search, "Search"));
  check("firstName", validateSearchText(firstName, "First name"));
  check("lastName", validateSearchText(lastName, "Last name"));
  check("username", validateSearchText(username, "Username"));
  check("email", validateSearchText(email, "Email", 254));

  if (role !== undefined && role !== "") {
    check("role", validateRole(query.role));
  }

  if (errors.length > 0) {
    throw new AppError("Validation failed.", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};

exports.updateUsersValidator = (body) => {
  const { firstName, lastName, email } = body;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  if (firstName !== undefined) {
    check("firstName", validateName(firstName, "First name"));
  }

  if (lastName !== undefined) {
    check("lastName", validateName(lastName, "Last name"));
  }

  if (email !== undefined) {
    check("email", validateEmail(email));
  }

  if (errors.length > 0) {
    throw new AppError("Validation failed.", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};
