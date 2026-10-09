const prisma = require("../prisma");
const { prepareNewUserService } = require("./userService");
const { SAFE_PATIENT_SELECT } = require("../constants/patient");
const { flattenProfile } = require("../helpers/userHelpers");

const {
  buildDateRangeFilter,
  assertFound,
} = require("../helpers/commonHelpers");

const {
  STATUS: { SCHEDULED, CANCELLED },
} = require("../constants/AppointmentStatus");

const {
  ROLES: { PATIENT },
} = require("../constants/roles");

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

  return flattenProfile(newPatient);
};

exports.getPatientService = async (id) => {
  const patient = await prisma.patient.findUnique({
    where: { id, user: { deletedAt: null } },
    select: SAFE_PATIENT_SELECT,
  });

  assertFound(patient, "Patient");

  return flattenProfile(patient);
};

exports.listPatientsService = async (query) => {
  const {
    search,
    firstName,
    lastName,
    username,
    email,
    role,
    isActive,
    createdFrom,
    createdTo,
    updatedFrom,
    updatedTo,
    insuranceNumber,
    preferredName,
    hasPreferredName,
  } = query;

  const createdAt = buildDateRangeFilter(createdFrom, createdTo);
  const updatedAt = buildDateRangeFilter(updatedFrom, updatedTo);

  const contains = (value) => ({ contains: value, mode: "insensitive" });

  const userFilter = {
    deletedAt: null,
    ...(firstName && { firstName: contains(firstName) }),
    ...(lastName && { lastName: contains(lastName) }),
    ...(username && { username: contains(username) }),
    ...(email && { email: contains(email) }),
    ...(role && { role }),
    ...(isActive !== undefined && { isActive }),
    ...(createdAt && { createdAt }),
    ...(updatedAt && { updatedAt }),
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
      user: userFilter,
      ...(insuranceNumber && { insuranceNumber: contains(insuranceNumber) }),
      ...(conditions.length > 0 && { AND: conditions }),
    },
    select: SAFE_PATIENT_SELECT,
    orderBy: { id: "asc" },
    take: 100,
  });

  return patients.map(flattenProfile);
};

exports.updatePatientService = async (id, data) => {
  const { preferredName, insuranceNumber, ...account } = data;

  const updatedPatient = await prisma.patient.update({
    where: { id, user: { deletedAt: null } },
    data: {
      insuranceNumber,
      preferredName,
      ...(Object.keys(account).length > 0 && { user: { update: account } }),
    },
    select: SAFE_PATIENT_SELECT,
  });

  return flattenProfile(updatedPatient);
};

exports.deletePatientService = async (id) => {
  const now = new Date();
  const today = new Date(now.toISOString().slice(0, 10)); // inicio del día en UTC

  await prisma.$transaction([
    prisma.user.update({
      where: { id, deletedAt: null, role: PATIENT },
      data: { deletedAt: now },
    }),

    prisma.appointment.updateMany({
      where: { patientId: id, status: SCHEDULED, date: { gte: today } },
      data: { status: CANCELLED, cancelledAt: now },
    }),
  ]);
};
