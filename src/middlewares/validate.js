const AppError = require("../utils/AppError");
const { INVALID_BODY } = require("../constants/errorCodes");

const isPlainObject = (data) =>
  data !== null && typeof data === "object" && !Array.isArray(data);

module.exports =
  (validator, source = "body") =>
  (req, res, next) => {
    try {
      const raw = req[source];

      if (!isPlainObject(raw)) {
        throw new AppError(
          `The request ${source} is invalid.`,
          400,
          INVALID_BODY,
        );
      }

      req.validated = { ...req.validated, [source]: validator(raw) };
      next();
    } catch (err) {
      next(err);
    }
  };
