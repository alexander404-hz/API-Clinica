const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const { TOKEN_MISSING, TOKEN_INVALID } = require("../constants/errorCodes");

exports.authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return next(
      new AppError("Access denied, no token provided.", 401, TOKEN_MISSING),
    );
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return next(
        new AppError("Invalid or expired token.", 401, TOKEN_INVALID),
      );
    }

    req.user = user;
    next();
  });
};
