const AppError = require("../utils/AppError");
const { VALIDATION_ERROR } = require("../constants/errorCodes");
const { checkUserFields } = require("./userValidator");
const { fieldChecker } = require("./validatorUtils");

exports.createAdminValidator = (body) => {
  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  checkUserFields(body, check);

  if (errors.length > 0) {
    throw new AppError("Validation failed", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};
