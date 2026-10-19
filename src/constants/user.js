const { Role } = require("../prisma");
const { ADMIN, PATIENT } = Role;

exports.VALID_ROLES = Object.values(Role);

exports.DELETED_FILTER = Object.freeze({
  ONLY: "ONLY",
  INCLUDE: "INCLUDE",
});

exports.VALID_DELETED = Object.values(exports.DELETED_FILTER);

exports.USER_EDITABLE_FIELDS = Object.freeze({
  [ADMIN]: ["firstName", "lastName", "email"],
  [PATIENT]: ["email"],
});

exports.USER_MIN_SELECT = Object.freeze({
  id: true,
  firstName: true,
  lastName: true,
  role: true,
});

exports.USER_BASE_SELECT = Object.freeze({
  ...exports.USER_MIN_SELECT,
  username: true,
  email: true,
});

exports.USER_DETAILS_SELECT = Object.freeze({
  ...exports.USER_BASE_SELECT,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  mustChangePassword: true,
});

exports.USER_FULL_SELECT = Object.freeze({
  ...exports.USER_DETAILS_SELECT,
  deletedAt: true,
});
