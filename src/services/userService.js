const { prisma } = require("../prisma");

const auditChanges = require("../utils/auditChanges");
const { paginate } = require("../utils/paginate");

const {
  buildRangeFilter,
  assertFound,
  contains,
  buildSearchConditions,
} = require("../helpers/commonHelpers");

const {
  generateUsername,
  generatePassword,
  generateHashedPassword,
  assertNotSelf,
  deletedAtFilter,
  userSelectFor,
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
    select: userSelectFor(),
  });

  assertFound(user, "User");

  return user;
};

exports.listUsersService = async (query) => {
  const { search, firstName, lastName, username, email, role } = query;
  const { isActive, createdFrom, createdTo, updatedFrom, updatedTo } = query;
  const { deleted, limit, cursor } = query;

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

  const searchFields = ["firstName", "lastName", "username", "email"];
  const conditions = buildSearchConditions(search, searchFields);

  const users = await paginate(prisma.user, {
    where: {
      ...userFilters,
      AND: conditions,
      NOT: { role: "SYSTEM" },
    },
    select: userSelectFor(deleted),
    orderBy: { id: "asc" },
    limit,
    cursor,
  });

  return users;
};

exports.updateUserService = async (id, data, currentUserId, ip) => {
  const { firstName, lastName, email, isActive } = data;

  if (isActive === false) {
    assertNotSelf(id, currentUserId, "deactivate");
  }

  const actor = { id: currentUserId, ip };

  const updatedUser = await auditChanges(actor, async (tx) => {
    return await tx.user.update({
      where: { id, deletedAt: null, NOT: { role: "SYSTEM" } },
      data: { firstName, lastName, email, isActive },
      select: userSelectFor(),
    });
  });

  return updatedUser;
};
