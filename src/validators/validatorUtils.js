const { INVALID_BODY } = require("../constants/errorCodes");

exports.assertValidBody = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new AppError("The request body is invalid.", 400, INVALID_BODY);
  }
};

exports.fieldChecker = (errors, cleaned) => {
  return (field, result) => {
    if (result.error) {
      errors.push({ field, message: result.error });
    } else {
      cleaned[field] = result.value;
    }
  };
};
