const {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_BYTES,
} = require("../constants/security");

const validatePassword = (value) => {
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
