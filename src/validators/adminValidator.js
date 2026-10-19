const AppError = require("../utils/AppError");

const { VALIDATION_ERROR } = require("../constants/errorCodes");
const { checkUserFieldsToCreate } = require("./userValidator");
const { fieldChecker } = require("./validatorUtils");

exports.createAdminValidator = (body) => {
  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  checkUserFieldsToCreate(body, check);

  if (errors.length > 0) {
    throw new AppError("Validation failed", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};
