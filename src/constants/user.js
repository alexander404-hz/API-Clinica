const { ADMIN, DOCTOR, PATIENT } = require("./roles");

exports.SELF_USER_EDITABLE_FIELDS = Object.freeze({
  [ADMIN]: ["firstName", "lastName", "email"],
  [DOCTOR]: ["email"],
  [PATIENT]: ["email"],
});

exports.SAFE_USER_SELECT = Object.freeze({
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  email: true,
  role: true,
});
