const AppError = require("../utils/AppError");
const { FORBIDDEN } = require("../constants/errorCodes");

const isPlainObject = (data) =>
  data !== null && typeof data === "object" && !Array.isArray(data);

module.exports = (fieldsByRole) => (req, res, next) => {
  if (!isPlainObject(req.body)) return next();

  const allowed = fieldsByRole[req.user.role] ?? [];
  const forbidden = Object.keys(req.body).filter((f) => !allowed.includes(f));

  if (forbidden.length > 0) {
    return next(
      new AppError(
        "You are not allowed to edit some of these fields.",
        403,
        FORBIDDEN,
        forbidden.map((field) => ({
          field,
          message: `You cannot edit ${field}.`,
        })),
      ),
    );
  }

  next();
};