const { PrismaClient } = require("../../generated/prisma");

const {
  ROLES: { PATIENT },
} = require("../constants/roles");

exports.SAFE_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  email: true,
  role: true,
};

const prisma = new PrismaClient();

exports.generateUsername = async (firstName, lastName) => {
  const createdAt = new Date();
  const year = String(createdAt.getFullYear()).slice(-2);
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();

  const userCount = await prisma.user.count({
    where: { username: { startsWith: `${initials}${year}` } },
  });

  return `${initials}${year}${String(userCount + 1).padStart(3, "0")}`;
};

exports.buildProfileData = (role) => {
  if (role === PATIENT) return { patientProfile: { create: {insuranceNumber: "xd"} } };
  return {};
};

/* const existingUser = await prisma.user.findUnique({
  where: { email: dataUserValidated.email },
  select: { id: true },
});

if (existingUser) {
  throw new AppError("El email ya está registrado", 409);
}
 */
