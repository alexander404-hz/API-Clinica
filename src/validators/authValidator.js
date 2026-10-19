const AppError = require("../utils/AppError");

const { VALIDATION_ERROR } = require("../constants/errorCodes");
const { checkPatientFieldsToCreate } = require("./patientValidator");
const { fieldChecker } = require("./validatorUtils");
const { validateString } = require("./commonValidator");

const {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_BYTES,
} = require("../constants/security");

const PASSWORD_RULES = [
  { test: /\p{Lu}/u, message: "at least one uppercase letter" },
  { test: /\p{Ll}/u, message: "at least one lowercase letter" },
  { test: /\d/, message: "at least one number" },
  {
    test: /[^\p{L}\d\s]/u,
    message: "at least one special character (e.g. * ! @ #)",
  },
];

const validatePassword = (value, label = "Password", required = false) => {
  const result = validateString(value, label, required, 72, true);
  if (result.error || result.value === undefined) return result;

  const password = result.value;

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
    };
  }

  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    return {
      error: `Password is too long (maximum ${PASSWORD_MAX_BYTES} bytes; characters like ñ or emojis use more than one byte).`,
    };
  }

  const missing = PASSWORD_RULES.filter((rule) => !rule.test.test(password));

  if (missing.length > 0) {
    return {
      error: `Password must include ${missing.map((r) => r.message).join(", ")}.`,
    };
  }

  return { value: password };
};

const validateIdentifier = (value, required = false) => {
  const result = validateString(value, "Identifier", required, 254);
  if (result.error || result.value === undefined) return result;

  const identifier = result.value;

  if (identifier.includes("@")) return { value: identifier.toLowerCase() };
  else return { value: identifier.toUpperCase() };
};

const validateChangePassword = (currentPassword, newPassword) => {
  const currentPass = validateString(
    currentPassword,
    "Current Password",
    true,
    72,
    true,
  );

  const newPass = validatePassword(newPassword, "New Password", true);

  if (currentPass.value === newPass.value) {
    return {
      currentPass,
      newPass: { error: "New password must be different." },
    };
  }

  return { currentPass, newPass };
};

exports.registerPatientValidator = (body) => {
  const { password } = body;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  checkPatientFieldsToCreate(body, check);
  check("password", validatePassword(password, "Password", true));

  if (errors.length > 0) {
    throw new AppError("Validation failed", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};

exports.loginValidator = (body) => {
  const { identifier, password } = body;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  check("identifier", validateIdentifier(identifier, true));
  check("password", validateString(password, "Password", true, 72, true));

  if (errors.length > 0) {
    throw new AppError("Validation failed", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};

exports.changePasswordValidator = (body) => {
  const { currentPassword, newPassword } = body;

  const errors = [];
  const cleaned = {};
  const check = fieldChecker(errors, cleaned);

  const password = validateChangePassword(currentPassword, newPassword);

  check("currentPassword", password.currentPass);
  check("newPassword", password.newPass);

  if (errors.length > 0) {
    throw new AppError("Validation failed", 400, VALIDATION_ERROR, errors);
  }

  return cleaned;
};
