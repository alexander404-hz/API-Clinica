const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userRules = {
  id: {
    isValid: (value) => Number.isInteger(value) && value > 0,
    invalidMessage: "El id debe ser un numero entero positivo",
    isDuplicate: (user, value) => user.id === value,
    duplicateMessage: "El id ya existe",
  },
  name: {
    isValid: (value) => typeof value === "string" && value.trim().length >= 2,
    invalidMessage: "El name debe ser un texto de al menos 2 caracteres",
  },
  username: {
    isValid: (value) =>
      typeof value === "string" && /^[a-zA-Z0-9_]{3,20}$/.test(value),
    invalidMessage:
      "El username debe tener entre 3 y 20 caracteres alfanumericos o guion bajo",
    isDuplicate: (user, value) => user.username === value,
    duplicateMessage: "El username ya existe",
  },
  email: {
    isValid: (value) => typeof value === "string" && emailRegex.test(value),
    invalidMessage: "El email no tiene un formato valido",
    isDuplicate: (user, value) =>
      typeof user.email === "string" &&
      user.email.toLowerCase() === value.toLowerCase(),
    duplicateMessage: "El email ya existe",
  },
  role: {
    isValid: (value) => ["admin", "editor", "user", "viewer"].includes(value),
    invalidMessage: "El role debe ser admin, editor, user o viewer",
  },
  is_active: {
    isValid: (value) => typeof value === "boolean",
    invalidMessage: "El is_active debe ser true o false",
  },
  created_at: {
    isValid: (value) =>
      typeof value === "string" && !Number.isNaN(Date.parse(value)),
    invalidMessage: "El created_at debe ser una fecha valida",
  },
};

function validateUser(users, userData, requiredFields = [], currentUserId) {
  const errors = [];
  const isProvided = (value) => value !== undefined && value !== null;
  const isAnotherUser = (user) =>
    currentUserId === undefined || user.id !== currentUserId;

  for (const field of requiredFields) {
    if (!isProvided(userData[field])) {
      errors.push(`El campo ${field} es obligatorio`);
    }
  }

  for (const [field, rule] of Object.entries(userRules)) {
    const value = userData[field];

    if (!isProvided(value)) {
      continue;
    }

    if (!rule.isValid(value)) {
      errors.push(rule.invalidMessage);
      continue;
    }

    if (
      rule.isDuplicate &&
      users.some((user) => isAnotherUser(user) && rule.isDuplicate(user, value))
    ) {
      errors.push(rule.duplicateMessage);
    }
  }

  return errors;
}

module.exports = validateUser;
