const prisma = require("../prisma");
const { SAFE_USER_SELECT } = require("../constants/user");
const {
  buildDateRangeFilter,
  assertFound,
} = require("../helpers/commonHelpers");

const {
  generateUsername,
  generatePassword,
  generateHashedPassword,
  assertNotSelf,
} = require("../helpers/userHelpers");

exports.prepareNewUserService = async (data) => {
  const { firstName, lastName, email, password } = data;

  const username = await generateUsername(firstName, lastName);

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
    },
  };

  return preparedNewUser;
};

exports.getUserService = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    select: SAFE_USER_SELECT,
  });

  assertFound(user);

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
    },
    select: SAFE_USER_SELECT,
    orderBy: { id: "asc" },
    take: 100,
  });

  return users;
};

exports.updateUserService = async (id, data, currentUserId) => {
  const { firstName, lastName, email, isActive } = data;

  if (isActive === false) {
    assertNotSelf(id, currentUserId, "deactivate");
  }

  const updatedUser = await prisma.user.update({
    where: { id, deletedAt: null },
    data: { firstName, lastName, email, isActive },
    select: SAFE_USER_SELECT,
  });

  return updatedUser;
};

exports.deleteUserService = async (id, currentUserId) => {
  assertNotSelf(id, currentUserId, "delete");

  await prisma.user.update({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
};
