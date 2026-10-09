const AppError = require("../utils/AppError");
const { NOT_FOUND } = require("../constants/errorCodes");

exports.buildDateRangeFilter = (from, to) => {
  const range = {
    ...(from && { gte: from }),
    ...(to && { lte: to }),
  };

  return Object.keys(range).length > 0 ? range : undefined;
};

exports.assertFound = (resource, label = "Resource") => {
  if (!resource) {
    throw new AppError(`${label} not found.`, 404, NOT_FOUND);
  }
};
