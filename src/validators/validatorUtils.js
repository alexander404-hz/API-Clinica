const AppError = require("../utils/AppError");

const { validateId } = require("./commonValidator");
const { VALIDATION_ERROR } = require("../constants/errorCodes");

exports.idParamValidator = (params) => {
  const result = validateId(params.id);

  if (result.error) {
    throw new AppError("Validation failed.", 400, VALIDATION_ERROR, [
      { field: "id", message: result.error },
    ]);
  }

  return { id: result.value };
};

exports.fieldChecker = (errors, cleaned) => (field, result) => {
  if (result.error) {
    errors.push({ field, message: result.error });
  } else if (result.value !== undefined) {
    cleaned[field] = result.value;
  }
};
