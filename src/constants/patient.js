const {
  ROLES: { ADMIN, PATIENT },
} = require("../constants/roles");

const { SELF_USER_EDITABLE_FIELDS, SAFE_USER_SELECT } = require("./user");

const PATIENT_EDITABLE_FIELDS = {
  [ADMIN]: ["insuranceNumber", "preferredName"],
  [PATIENT]: ["preferredName"],
};

exports.SELF_PATIENT_EDITABLE_FIELDS = Object.freeze({
  [ADMIN]: Object.freeze([
    ...(SELF_USER_EDITABLE_FIELDS[ADMIN] || []),
    ...PATIENT_EDITABLE_FIELDS[ADMIN],
  ]),
  [PATIENT]: Object.freeze([
    ...(SELF_USER_EDITABLE_FIELDS[PATIENT] || []),
    ...PATIENT_EDITABLE_FIELDS[PATIENT],
  ]),
});

exports.SAFE_PATIENT_SELECT = Object.freeze({
  id: true,
  insuranceNumber: true,
  preferredName: true,
  user: { select: SAFE_USER_SELECT },
});
