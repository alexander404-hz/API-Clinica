const AppError = require("../utils/AppError");
const { VALIDATION_ERROR } = require("../constants/errorCodes");
const { checkUserFields } = require("./userValidator");
const { fieldChecker } = require("./validatorUtils");

const {
  validateInsuranceNumber,
  validatePreferredName,
  validateSearchText,
  validateBooleanFilter,
} = require("./fieldValidator");

exports.createPatientValidator = (body) => {
  const { preferredName, insuranceNumber } = body;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  checkUserFields(body, check);

  check("insuranceNumber", validateInsuranceNumber(insuranceNumber));

  if (preferredName !== undefined) {
    check("preferredName", validatePreferredName(preferredName));
  }

  if (errors.length > 0) {
    throw new AppError("Validation failed", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};

exports.listPatientsValidator = (query) => {
  const {
    search,
    firstName,
    lastName,
    username,
    email,
    insuranceNumber,
    preferredName,
    hasPreferredName,
  } = query;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  check("search", validateSearchText(search, "Search"));
  check("firstName", validateSearchText(firstName, "First name"));
  check("lastName", validateSearchText(lastName, "Last name"));
  check("username", validateSearchText(username, "Username"));
  check("email", validateSearchText(email, "Email", 254));
  check("preferredName", validateSearchText(preferredName, "Preferred name"));
  check(
    "hasPreferredName",
    validateBooleanFilter(hasPreferredName, "Has preferred name"),
  );
  check(
    "insuranceNumber",
    validateSearchText(insuranceNumber, "Insurance number", 8),
  );

  if (errors.length > 0) {
    throw new AppError("Validation failed.", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};
