const AppError = require("../utils/AppError");
const { validateId } = require("../validators/fieldValidator");
const { VALIDATION_ERROR } = require("../constants/errorCodes");

exports.idParamValidator = (params) => {
  const result = validateId(params.id);

  if (result.error) {
    throw new AppError("Validation failed.", 400, VALIDATION_ERROR, [
      { field: "/id", message: result.error },
    ]);
  }

  return { id: result.value };
};
