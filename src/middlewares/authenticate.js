const AppError = require("../utils/AppError");
const { prisma } = require("../prisma");

const jwt = require("jsonwebtoken");
const { TOKEN_MISSING, TOKEN_INVALID } = require("../constants/errorCodes");

exports.authenticateToken = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return next(
      new AppError("Access denied, no token provided.", 401, TOKEN_MISSING),
    );
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError("Invalid or expired token.", 401, TOKEN_INVALID);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id, deletedAt: null },
    select: {
      id: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      passwordChangedAt: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError("Invalid or expired token.", 401, TOKEN_INVALID);
  }

  // Tokens emitidos antes del último cambio de contraseña dejan de valer
  const isAPreviousToken =
    user.passwordChangedAt &&
    payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000);

  if (isAPreviousToken) {
    throw new AppError("Invalid or expired token.", 401, TOKEN_INVALID);
  }

  req.user = {
    id: user.id,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };

  next();
};
