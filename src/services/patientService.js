const { prisma, Role, AppointmentStatus } = require("../prisma");
const { PATIENT } = Role;
const { SCHEDULED, CANCELLED } = AppointmentStatus;

const { prepareNewUserService } = require("./userService");
const { withAudit } = require("../utils/whithAudit");

const {
  PATIENT_DETAILS_SELECT,
  PATIENT_FULL_SELECT,
} = require("../constants/patient");

const {
  flattenUser,
  deletedAtFilter,
  assertUserUpdated,
} = require("../helpers/userHelpers");

const {
  buildRangeFilter,
  assertFound,
  contains,
} = require("../helpers/commonHelpers");

exports.createPatientService = async (data, currentUserId, ip) => {
  const { preferredName, insuranceNumber } = data;
  const { userData, tempPassword } = await prepareNewUserService(prisma, data);

  const actor = { id: currentUserId, ip };

  const newPatient = await withAudit(actor, async (tx) => {
    return await tx.patient.create({
      data: {
        insuranceNumber,
        preferredName,
        user: { create: { ...userData, role: PATIENT } },
      },
      select: PATIENT_DETAILS_SELECT,
    });
  });

  // Simula enviar correo: credenciales al nuevo usuario
  console.log(
    `[email:simulated] To: ${newPatient.user.email} | Welcome! Your username is ${newPatient.user.username}. ${tempPassword ? "\n Your temp password is : " + tempPassword : ""}`,
  );

  return flattenUser(newPatient);
};

exports.getPatientService = async (id) => {
  const patient = await prisma.patient.findUnique({
    where: { id, user: { deletedAt: null } },
    select: PATIENT_DETAILS_SELECT,
  });

  assertFound(patient, "Patient");

  return flattenUser(patient);
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
    deleted,
  } = query;

  const createdAt = buildRangeFilter(createdFrom, createdTo);
  const updatedAt = buildRangeFilter(updatedFrom, updatedTo);

  const userFilter = {
    deletedAt: deletedAtFilter(deleted),
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
    select: deleted ? PATIENT_FULL_SELECT : PATIENT_DETAILS_SELECT,
    orderBy: { id: "asc" },
    take: 100,
  });

  return patients.map(flattenUser);
};

exports.updatePatientService = async (id, data, currentUserId, ip) => {
  const { preferredName, insuranceNumber, ...account } = data;

  const actor = { id: currentUserId, ip };

  const updatedPatient = await withAudit(actor, async (tx) => {
    return await tx.patient.update({
      where: { id, user: { deletedAt: null } },
      data: {
        insuranceNumber,
        preferredName,
        ...(Object.keys(account).length > 0 && { user: { update: account } }),
      },
      select: PATIENT_DETAILS_SELECT,
    });
  });

  return flattenUser(updatedPatient);
};

exports.deletePatientService = async (id, currentUserId, ip) => {
  const now = new Date();
  const actor = { id: currentUserId, ip };

  await withAudit(actor, async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id, deletedAt: null, role: PATIENT },
      data: { isActive: false, deletedAt: now },
    });

    assertUserUpdated(count, "Patient");

    await tx.appointment.updateMany({
      where: { patientId: id, status: SCHEDULED, startsAt: { gte: now } },
      data: {
        status: CANCELLED,
        statusChangedAt: now,
        statusChangedById: currentUserId,
      },
    });
  });
};
