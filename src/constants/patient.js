const { Role } = require("../prisma");
const { ADMIN, PATIENT } = Role;

const {
  USER_EDITABLE_FIELDS,
  USER_BASE_SELECT,
  USER_DETAILS_SELECT,
  USER_FULL_SELECT,
} = require("./user");

const PATIENT_EDITABLE_FIELDS = {
  [ADMIN]: ["insuranceNumber", "preferredName"],
  [PATIENT]: ["preferredName"],
};

exports.PATIENT_EDITABLE_FIELDS = Object.freeze({
  [ADMIN]: Object.freeze([
    ...(USER_EDITABLE_FIELDS[ADMIN] || []),
    ...PATIENT_EDITABLE_FIELDS[ADMIN],
  ]),
  [PATIENT]: Object.freeze([
    ...(USER_EDITABLE_FIELDS[PATIENT] || []),
    ...PATIENT_EDITABLE_FIELDS[PATIENT],
  ]),
});

exports.PATIENT_BASE_SELECT = Object.freeze({
  id: true,
  user: { select: USER_BASE_SELECT },
  insuranceNumber: true,
  preferredName: true,
});

exports.PATIENT_DETAILS_SELECT = Object.freeze({
  id: true,
  user: { select: USER_DETAILS_SELECT },
  insuranceNumber: true,
  preferredName: true,
});

exports.PATIENT_FULL_SELECT = Object.freeze({
  id: true,
  user: { select: USER_FULL_SELECT },
  insuranceNumber: true,
  preferredName: true,
});