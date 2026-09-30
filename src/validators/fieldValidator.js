const AppError = require("../utils/AppError");
const { VALID_ROLES } = require("../constants/roles");

const {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_BYTES,
} = require("../constants/security");

const NAME_PATTERN = /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRequiredString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    return { error: `${label} is required.` };
  }

  return { value: value.trim() };
}

exports.validateName = (value, label) => {
  const required = validateRequiredString(value, label);
  if (required.error) return required;

  const name = required.value;

  if (name.length > 50) {
    return { error: `${label} must be at most 50 characters long.` };
  }

  if (!NAME_PATTERN.test(name)) {
    return {
      error: `${label} can only contain letters, spaces, hyphens and apostrophes.`,
    };
  }

  return { value: name };
};

exports.validateEmail = (value) => {
  const required = validateRequiredString(value, "Email");
  if (required.error) return required;

  const email = required.value.toLowerCase();

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { error: "Email must have a valid format." };
  }

  return { value: email };
};

exports.validatePassword = (value) => {
  if (typeof value !== "string" || !value) {
    return { error: "Password is required." };
  }
  if (
    value.length < PASSWORD_MIN_LENGTH ||
    Buffer.byteLength(value, "utf8") > PASSWORD_MAX_BYTES
  ) {
    return { error: "Password must be between 8 and 72 characters long." };
  }
  return { value };
};

exports.validateRole = (value) => {
  const required = validateRequiredString(value, "Role");
  if (required.error) return required;

  const role = required.value.toUpperCase();

  if (!VALID_ROLES.includes(role)) {
    return { error: `Role must be one of: ${VALID_ROLES.join(", ")}.` };
  }

  return { value: role };
};
