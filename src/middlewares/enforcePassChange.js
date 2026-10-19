const AppError = require("../utils/AppError");
const { MUST_CHANGE_PASSWORD } = require("../constants/errorCodes");

exports.enforcePasswordChange = (req, res, next) => {
  if (req.user.mustChangePassword) {
    throw new AppError(
      "You must change your password before continuing.",
      403,
      MUST_CHANGE_PASSWORD,
    );
  }

  next();
};
