const { prisma } = require("../prisma");

exports.resolveAccount = async (req, res, next) => {
  const { identifier } = req.validated.body;

  const where = identifier.includes("@")
    ? { email: identifier }
    : { username: identifier };

  req.account = await prisma.user.findUnique({
    where: { ...where, deletedAt: null },
    select: {
      id: true,
      email: true,
      username: true,
      password: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
    },
  });

  req.accountKey = req.account
    ? `user:${req.account.id}`
    : `unknown:${identifier.toLowerCase()}`;

  next();
};
