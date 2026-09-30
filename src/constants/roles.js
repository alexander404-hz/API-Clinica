const ROLES = Object.freeze({
  ADMIN: "ADMIN",
  DOCTOR: "DOCTOR",
  PATIENT: "PATIENT",
});

const VALID_ROLES = Object.values(ROLES);

module.exports = { ROLES, VALID_ROLES };