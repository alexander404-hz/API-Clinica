const { SELF_USER_EDITABLE_FIELDS, SAFE_USER_SELECT } = require("./user");
const { ADMIN, DOCTOR, PATIENT } = require("./roles");

const PATIENT_EDITABLE_FIELDS = {
  [ADMIN]: ["insuranceNumber", "preferredName"],
  [DOCTOR]: ["preferredName"],
  [PATIENT]: ["preferredName"],
};

exports.SELF_PATIENT_EDITABLE_FIELDS = Object.freeze({
  [ADMIN]: Object.freeze([
    ...(SELF_USER_EDITABLE_FIELDS[ADMIN] || []),
    ...PATIENT_EDITABLE_FIELDS[ADMIN],
  ]),
  [DOCTOR]: Object.freeze([
    ...(SELF_USER_EDITABLE_FIELDS[DOCTOR] || []),
    ...PATIENT_EDITABLE_FIELDS[DOCTOR],
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
