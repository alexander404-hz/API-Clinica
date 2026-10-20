const { prisma } = require("../prisma");

const { USER_DETAILS_SELECT, USER_FULL_SELECT } = require("../constants/user");
const { withAudit } = require("../utils/whithAudit");

const {
  buildRangeFilter,
  assertFound,
  contains,
} = require("../helpers/commonHelpers");

const {
  generateUsername,
  generatePassword,
  generateHashedPassword,
  assertNotSelf,
  deletedAtFilter,
} = require("../helpers/userHelpers");

exports.prepareNewUserService = async (tx, data) => {
  const { firstName, lastName, email, password } = data;

  const username = await generateUsername(tx, firstName, lastName);

  const tempPassword = password ? null : generatePassword();
  const plainPassword = password || tempPassword;
  const hashedPassword = await generateHashedPassword(plainPassword);

  const preparedNewUser = {
    tempPassword,
    userData: {
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      ...(password && { mustChangePassword: false }),
    },
  };

  return preparedNewUser;
};

exports.getUserService = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null, NOT: { role: "SYSTEM" } },
    select: USER_DETAILS_SELECT,
  });

  assertFound(user, "User");

  return user;
};

exports.listUsersService = async (query) => {
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

  const words = search ? search.split(/\s+/).slice(0, 5) : [];

  const users = await prisma.user.findMany({
    where: {
      ...(words.length > 0 && {
        AND: words.map((word) => ({
          OR: [
            { firstName: contains(word) },
            { lastName: contains(word) },
            { username: contains(word) },
            { email: contains(word) },
          ],
        })),
      }),
      ...userFilter,
      NOT: { role: "SYSTEM" },
    },
    select: deleted ? USER_FULL_SELECT : USER_DETAILS_SELECT,
    orderBy: { id: "asc" },
    take: 100,
  });

  return users;
};

exports.updateUserService = async (id, data, currentUserId, ip) => {
  const { firstName, lastName, email, isActive } = data;

  if (isActive === false) {
    assertNotSelf(id, currentUserId, "deactivate");
  }

  const actor = { id: currentUserId, ip };

  const updatedUser = await withAudit(actor, async (tx) => {
    return await tx.user.update({
      where: { id, deletedAt: null, NOT: { role: "SYSTEM" } },
      data: { firstName, lastName, email, isActive },
      select: USER_DETAILS_SELECT,
    });
  });

  return updatedUser;
};
