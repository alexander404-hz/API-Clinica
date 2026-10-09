const {
  ROLES: { ADMIN, PATIENT },
} = require("../constants/roles");

exports.SELF_USER_EDITABLE_FIELDS = Object.freeze({
  [ADMIN]: ["firstName", "lastName", "email"],
  [PATIENT]: ["email"],
});

exports.SAFE_USER_SELECT = Object.freeze({
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});
