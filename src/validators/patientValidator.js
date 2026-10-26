const AppError = require("../utils/AppError");

const { VALIDATION_ERROR } = require("../constants/errorCodes");
const { fieldChecker } = require("./validatorUtils");
const {
  validateString,
  validateBoolean,
  validateSearch,
  validateLimit,
  validateIntegerParam,
} = require("./commonValidator");

const {
  PREFERRED_NAME_PATTERN,
  INSURANCE_NUMBER_PATTERN,
} = require("../constants/pattern");

const {
  checkUserFieldsToCreate,
  checkUserFieldsToUpdate,
  checkUserFieldsToFilter,
} = require("./userValidator");

const validatePreferredName = (value) => {
  const result = validateString(value, "Preferred Name");
  if (result.error || result.value === undefined) return result;

  const preferredName = result.value;

  if (!PREFERRED_NAME_PATTERN.test(preferredName)) {
    return {
      error:
        "Preferred name can only contain letters, numbers, spaces, hyphens and apostrophes.",
    };
  }

  return { value: preferredName };
};

const validateInsuranceNumber = (value, required = false) => {
  const result = validateString(value, "Insurance number", required);
  if (result.error || result.value === undefined) return result;

  const insuranceNumber = result.value.toUpperCase();

  if (!INSURANCE_NUMBER_PATTERN.test(insuranceNumber)) {
    return { error: 'Insurance number must follow the format "INS-0001".' };
  }

  return { value: insuranceNumber };
};

exports.checkPatientFieldsToCreate = (body, check) => {
  const { preferredName, insuranceNumber } = body;

  checkUserFieldsToCreate(body, check);
  check("insuranceNumber", validateInsuranceNumber(insuranceNumber, true));
  check("preferredName", validatePreferredName(preferredName));
};

exports.createPatientValidator = (body) => {
  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  exports.checkPatientFieldsToCreate(body, check);

  if (errors.length > 0) {
    throw new AppError("Validation failed", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};

exports.listPatientsValidator = (query) => {
  const {
    search,
    insuranceNumber,
    preferredName,
    hasPreferredName,
    limit,
    cursor,
  } = query;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  check("search", validateSearch(search));

  checkUserFieldsToFilter(query, check);
  check("insuranceNumber", validateString(insuranceNumber, "Insurance number"));
  check("preferredName", validateString(preferredName, "Preferred name"));
  check(
    "hasPreferredName",
    validateBoolean(hasPreferredName, "Has preferred name"),
  );

  check("limit", validateLimit(limit));
  check("cursor", validateIntegerParam(cursor, "Cursor"));

  if (errors.length > 0) {
    throw new AppError("Validation failed.", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};

exports.updatePatientValidator = (body) => {
  const { preferredName, insuranceNumber } = body;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  checkUserFieldsToUpdate(body, check);
  check("insuranceNumber", validateInsuranceNumber(insuranceNumber));

  if (preferredName === null) cleaned.preferredName = null;
  else check("preferredName", validatePreferredName(preferredName));

  if (errors.length > 0) {
    throw new AppError("Validation failed.", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};
