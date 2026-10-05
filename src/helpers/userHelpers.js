const { PrismaClient } = require("../../generated/prisma");
const prisma = new PrismaClient();

const AppError = require("../utils/AppError");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { SALT_ROUNDS } = require("../constants/security");
const { NOT_FOUND, FORBIDDEN } = require("../constants/errorCodes");

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

exports.userFound = (user) => {
  if (!user) {
    throw new AppError("User not found.", 404, NOT_FOUND);
  }
};

exports.userOwnAccount = (id, currentUserId) => {
  if (id === currentUserId) {
    throw new AppError(
      "You cannot deactivate your own account.",
      409,
      FORBIDDEN,
    );
  }
};
