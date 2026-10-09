const prisma = require("../prisma");

const AppError = require("../utils/AppError");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { SALT_ROUNDS } = require("../constants/security");
const { FORBIDDEN } = require("../constants/errorCodes");

exports.generateUsername = async (firstName, lastName) => {
  const createdAt = new Date();
  const year = String(createdAt.getFullYear()).slice(-2);
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();

  const userCount = await prisma.user.count({
    where: { username: { startsWith: `${initials}${year}` } },
  });

  return `${initials}${year}${String(userCount + 1).padStart(3, "0")}`;
};

exports.generatePassword = (length = 4) => {
  return crypto.randomBytes(length).toString("base64url");
};

exports.generateHashedPassword = (plainPassword) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

exports.assertNotSelf = (id, currentUserId, label) => {
  if (id === currentUserId) {
    throw new AppError(`You cannot ${label} your own account.`, 409, FORBIDDEN);
  }
};

exports.flattenProfile = (userRole) => {
  const { user, ...profile } = userRole;
  const roleResponse = { ...user, ...profile };

  return roleResponse;
};
