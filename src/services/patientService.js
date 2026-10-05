const { PrismaClient } = require("../../generated/prisma");
const prisma = new PrismaClient();

const { prepareNewUserService } = require("./userService");
const { SAFE_PATIENT_SELECT } = require("../constants/patient");

const {
  ROLES: { PATIENT },
} = require("../constants/roles");
const { toPatientResponse } = require("../helpers/patientHelpers");

exports.createPatientService = async (data) => {
  const { userData, tempPassword } = await prepareNewUserService(data);
  const { preferredName, insuranceNumber } = data;

  const newPatient = await prisma.patient.create({
    data: {
      insuranceNumber,
      preferredName,
      user: { create: { ...userData, role: PATIENT } },
    },
    select: SAFE_PATIENT_SELECT,
  });

  if (tempPassword) console.log(tempPassword); // simula enviar por correo

  return toPatientResponse(newPatient);
};

exports.listPatientsService = async (query) => {
  const {
    search,
    firstName,
    lastName,
    username,
    email,
    insuranceNumber,
    preferredName,
    hasPreferredName,
  } = query;

  const contains = (value) => ({ contains: value, mode: "insensitive" });

  const userFilter = {
    ...(firstName && { firstName: contains(firstName) }),
    ...(lastName && { lastName: contains(lastName) }),
    ...(username && { username: contains(username) }),
    ...(email && { email: contains(email) }),
  };

  const conditions = [];
  const words = search ? search.split(/\s+/).slice(0, 5) : [];

  for (const word of words) {
    conditions.push({
      OR: [
        { user: { firstName: contains(word) } },
        { user: { lastName: contains(word) } },
        { user: { username: contains(word) } },
        { user: { email: contains(word) } },
        { insuranceNumber: contains(word) },
        { preferredName: contains(word) },
      ],
    });
  }

  if (preferredName) {
    conditions.push({ preferredName: contains(preferredName) });
  }

  if (hasPreferredName !== undefined) {
    conditions.push({
      preferredName: hasPreferredName ? { not: null } : null,
    });
  }

  const patients = await prisma.patient.findMany({
    where: {
      ...(Object.keys(userFilter).length > 0 && { user: userFilter }),
      ...(insuranceNumber && { insuranceNumber: contains(insuranceNumber) }),
      ...(conditions.length > 0 && { AND: conditions }),
    },
    select: SAFE_PATIENT_SELECT,
    orderBy: { id: "asc" },
    take: 1000,
  });

  return patients.map(toPatientResponse);
};

/*
exports.getUserService = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: SAFE_USER_SELECT,
  });

  userFound(user);

  return user;
};

exports.updateUserService = async (id, data) => {
  const { firstName, lastName, email } = data;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { firstName, lastName, email },
    select: SAFE_USER_SELECT,
  });

  return updatedUser;
};

exports.deleteUserService = async (id, currentUserId) => {
  userOwnAccount(id, currentUserId);

  await prisma.user.delete({
    where: { id },
  });
};
 */
