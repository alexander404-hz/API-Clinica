const AppError = require("../utils/AppError");
const { FORBIDDEN } = require("../constants/errorCodes");

module.exports =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to do this.", 403, FORBIDDEN),
      );
    }

    next();
  };
