const { prisma, Role, AppointmentStatus } = require("../prisma");
const { PATIENT } = Role;
const { SCHEDULED, CANCELLED } = AppointmentStatus;

const auditChanges = require("../utils/auditChanges");
const { PATIENT_DETAILS_SELECT } = require("../constants/patient");
const { prepareNewUserService } = require("./userService");
const { paginate } = require("../utils/paginate");

const {
  flattenUser,
  deletedAtFilter,
  assertUserUpdated,
  patientSelectFor,
} = require("../helpers/userHelpers");

const {
  buildRangeFilter,
  assertFound,
  contains,
  buildSearchConditions,
} = require("../helpers/commonHelpers");

exports.createPatientService = async (data, currentUserId, ip) => {
  const { preferredName, insuranceNumber } = data;
  const { userData, tempPassword } = await prepareNewUserService(prisma, data);

  const actor = { id: currentUserId, ip };

  const newPatient = await auditChanges(actor, async (tx) => {
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
    select: patientSelectFor(),
  });

  assertFound(patient, "Patient");

  return flattenUser(patient);
};

exports.listPatientsService = async (query) => {
  const { search, firstName, lastName, username, email, role } = query;
  const { isActive, createdFrom, createdTo, updatedFrom, updatedTo } = query;
  const { insuranceNumber, preferredName, hasPreferredName, deleted } = query;
  const { limit, cursor } = query;

  const userFilters = {
    deletedAt: deletedAtFilter(deleted),
    firstName: contains(firstName),
    lastName: contains(lastName),
    username: contains(username),
    email: contains(email),
    role: { in: role },
    isActive,
    createdAt: buildRangeFilter(createdFrom, createdTo),
    updatedAt: buildRangeFilter(updatedFrom, updatedTo),
  };

  const patientFilters = {
    insuranceNumber: contains(insuranceNumber),
    preferredName: contains(preferredName),
  };

  const searchFields = [
    "user.firstName",
    "user.lastName",
    "user.username",
    "user.email",
    "insuranceNumber",
    "preferredName",
  ];

  const conditions = buildSearchConditions(search, searchFields);

  if (hasPreferredName !== undefined) {
    conditions.push({
      preferredName: hasPreferredName ? { not: null } : null,
    });
  }

  const patients = await paginate(prisma.patient, {
    where: {
      user: userFilters,
      ...patientFilters,
      AND: conditions,
    },
    select: patientSelectFor(deleted),
    orderBy: { id: "asc" },
    limit,
    cursor,
    flatten: flattenUser,
  });

  return patients;
};

exports.updatePatientService = async (id, data, currentUserId, ip) => {
  const { preferredName, insuranceNumber, ...user } = data;

  const actor = { id: currentUserId, ip };

  const updatedPatient = await auditChanges(actor, async (tx) => {
    return await tx.patient.update({
      where: { id, user: { deletedAt: null } },
      data: {
        insuranceNumber,
        preferredName,
        user: { update: user },
      },
      select: patientSelectFor(),
    });
  });

  return flattenUser(updatedPatient);
};

exports.deletePatientService = async (id, currentUserId, ip) => {
  const now = new Date();
  const actor = { id: currentUserId, ip };

  await auditChanges(actor, async (tx) => {
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
