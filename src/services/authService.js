const AppError = require("../utils/AppError");
const { prisma } = require("../prisma");

const { SALT_ROUNDS } = require("../constants/security");
const { createPatientService } = require("./patientService");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
  INVALID_CREDENTIALS,
  ACCOUNT_DISABLED,
} = require("../constants/errorCodes");

exports.registerPatientService = async (data) => {
  try {
    await createPatientService(data);
  } catch (error) {
    // P2002 = unique constraint violation (email o insuranceNumber)
    if (error.code === "P2002") {
      console.log(
        `[email:simulated] To: ${data.email} | We received a registration request with this email. If it was you, try logging in or resetting your password. If you're having trouble, please contact support.`,
      );
      return;
    }

    console.error("Unexpected error in registerPatientService:", error);
  }
};

// Hash falso para comparar cuando la cuenta no existe (evita diferencias de tiempo).
const DUMMY_HASH = bcrypt.hashSync("dummy-password", SALT_ROUNDS);

exports.loginUserService = async (account, password) => {
  const hash = account?.password ?? DUMMY_HASH;
  const isValid = await bcrypt.compare(password, hash);

  if (!account || !isValid) {
    throw new AppError("Invalid credentials", 401, INVALID_CREDENTIALS);
  }

  if (!account.isActive) {
    throw new AppError("Account disabled", 403, ACCOUNT_DISABLED);
  }

  await prisma.user.update({
    where: { id: account.id },
    data: { lastLoginAt: new Date() },
  });

  return jwt.sign({ id: account.id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

exports.changePasswordService = async (userId, data) => {
  const { currentPassword, newPassword } = data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });

  if (!(await bcrypt.compare(currentPassword, user.password))) {
    throw new AppError(
      "Current password is incorrect.",
      400,
      INVALID_CREDENTIALS,
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: await bcrypt.hash(newPassword, SALT_ROUNDS),
      passwordChangedAt: new Date(),
      mustChangePassword: false,
    },
  });

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};
