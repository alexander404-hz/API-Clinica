const AppError = require("../utils/AppError");
const { VALID_ROLES } = require("../constants/roles");

const {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_BYTES,
} = require("../constants/security");

const MAX_INT = 2147483647;
const NAME_PATTERN = /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PREFERRED_NAME_PATTERN = /^[\p{L}0-9]+(?:[ '-][\p{L}0-9]+)*$/u;
const INSURANCE_NUMBER_PATTERN = /^INS-\d{4}$/;

function validateRequiredString(value, label) {
  if (value === undefined || value === null) {
    return { error: `${label} is required.` };
  }

  if (typeof value !== "string") {
    return { error: `${label} must be a text value.` };
  }

  const text = value.trim();

  if (!text) {
    return { error: `${label} cannot be empty.` };
  }

  return { value: text };
}

exports.validateId = (value) => {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return { error: "Id must be a positive integer." };
  }

  const id = Number(value);
  if (id < 1 || id > MAX_INT) {
    return { error: "Id must be a positive integer." };
  }

  return { value: id };
};

exports.validateSearchText = (value, label, max = 50) => {
  if (value === undefined) return { value: undefined };

  if (typeof value !== "string") {
    return { error: `${label} must be a text value.` };
  }

  const text = value.trim();
  if (!text) return { value: undefined };

  if (text.length > max) {
    return { error: `${label} must be at most ${max} characters long.` };
  }

  return { value: text };
};

exports.validateBooleanFilter = (value, label) => {
  if (value === undefined || value === "") return { value: undefined };

  if (value !== "true" && value !== "false") {
    return { error: `${label} must be "true" or "false".` };
  }

  return { value: value === "true" };
};

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

exports.validatePreferredName = (value) => {
  const required = validateRequiredString(value, "Preferred name");
  if (required.error) return required;

  const preferredName = required.value;

  if (preferredName.length > 50) {
    return { error: "Preferred name must be at most 50 characters long." };
  }

  if (!PREFERRED_NAME_PATTERN.test(preferredName)) {
    return {
      error:
        "Preferred name can only contain letters, numbers, spaces, hyphens and apostrophes.",
    };
  }

  return { value: preferredName };
};

exports.validateInsuranceNumber = (value) => {
  const required = validateRequiredString(value, "Insurance number");
  if (required.error) return required;

  const insuranceNumber = required.value.toUpperCase();

  if (!INSURANCE_NUMBER_PATTERN.test(insuranceNumber)) {
    return { error: 'Insurance number must follow the format "INS-0001".' };
  }

  return { value: insuranceNumber };
};
