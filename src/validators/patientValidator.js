const AppError = require("../utils/AppError");
const { VALIDATION_ERROR } = require("../constants/errorCodes");
const { fieldChecker } = require("./validatorUtils");
const { validateString, validateBoolean } = require("./commonValidator");

const {
  checkUserFieldsToCreate,
  checkUserFieldsToUpdate,
  checkUserFieldsToFilter,
} = require("./userValidator");

const PREFERRED_NAME_PATTERN = /^[\p{L}0-9]+(?:[ '-][\p{L}0-9]+)*$/u;
const INSURANCE_NUMBER_PATTERN = /^INS-\d{4}$/;

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

  const insuranceNumber = required.value.toUpperCase();

  if (!INSURANCE_NUMBER_PATTERN.test(insuranceNumber)) {
    return { error: 'Insurance number must follow the format "INS-0001".' };
  }

  return { value: insuranceNumber };
};

exports.createPatientValidator = (body) => {
  const { preferredName, insuranceNumber } = body;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  checkUserFieldsToCreate(body, check);
  check("insuranceNumber", validateInsuranceNumber(insuranceNumber));
  check("preferredName", validatePreferredName(preferredName));

  if (errors.length > 0) {
    throw new AppError("Validation failed", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};

exports.listPatientsValidator = (query) => {
  const { search, insuranceNumber, preferredName, hasPreferredName } = query;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  check("search", validateString(search, "Search"));
  checkUserFieldsToFilter(query, check);
  check(
    "preferredName",
    validatePreferredName(preferredName, "Preferred name"),
  );
  check(
    "hasPreferredName",
    validateBoolean(hasPreferredName, "Has preferred name"),
  );
  check(
    "insuranceNumber",
    validateInsuranceNumber(insuranceNumber, "Insurance number"),
  );

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
