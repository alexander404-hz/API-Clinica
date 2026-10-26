const AppError = require("../utils/AppError");

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { FORBIDDEN, NOT_FOUND } = require("../constants/errorCodes");
const { SALT_ROUNDS } = require("../constants/security");
const { DELETED_FILTER } = require("../constants/user");
const { ONLY, INCLUDE } = DELETED_FILTER;
const { USER_DETAILS_SELECT, USER_FULL_SELECT } = require("../constants/user");

const {
  PATIENT_DETAILS_SELECT,
  PATIENT_FULL_SELECT,
} = require("../constants/patient");

const toAsciiUpperInitial = (text = "") => {
  const clean = String(text)
    .normalize("NFD") // separa la letra de su tilde: "Á" -> "A" + "´"
    .replace(/[\u0300-\u036f]/g, "") // elimina las tildes y diéresis
    .replace(/[^a-zA-Z]/g, ""); // deja solo letras A-Z (quita espacios, números, símbolos)

  return clean[0]?.toUpperCase() ?? "";
};

exports.generateUsername = async (tx, firstName, lastName) => {
  const year = String(new Date().getFullYear()).slice(-2);
  const initials = `${toAsciiUpperInitial(firstName)}${toAsciiUpperInitial(lastName)}`;

  const prefix = `${initials}${year}`;

  const last = await tx.user.findFirst({
    where: { username: { startsWith: prefix } },
    orderBy: { username: "desc" },
    select: { username: true },
  });

  const next = last ? Number(last.username.slice(prefix.length)) + 1 : 1;

  return `${prefix}${String(next).padStart(3, "0")}`;
};

exports.generatePassword = (length = 4) => {
  return crypto.randomBytes(length).toString("base64url");
};

exports.generateHashedPassword = (plainPassword) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

exports.assertNotSelf = (id, currentUserId, label) => {
  if (id === currentUserId) {
    throw new AppError(`You cannot ${label} your own account.`, 409, FORBIDDEN);
  }
};

exports.flattenUser = (userRole) => {
  const { user, ...rest } = userRole;
  const { id, firstName, lastName, username, email, role, ...profile } = user;

  const flattenedUser = {
    id,
    firstName,
    lastName,
    username,
    email,
    ...rest,
    ...profile,
  };

  return flattenedUser;
};

exports.deletedAtFilter = (deleted) => {
  if (deleted === ONLY) return { not: null };
  if (deleted === INCLUDE) return undefined;
  return null;
};

exports.assertUserUpdated = (count, rol) => {
  if (count === 0) throw new AppError(`${rol} not found`, 404, NOT_FOUND);
};

exports.userSelectFor = (deleted = false) =>
  deleted ? USER_FULL_SELECT : USER_DETAILS_SELECT;

exports.patientSelectFor = (deleted = false) =>
  deleted ? PATIENT_FULL_SELECT : PATIENT_DETAILS_SELECT;
