const { PrismaClient } = require("../../generated/prisma");
const prisma = new PrismaClient();

const { SAFE_USER_SELECT } = require("../constants/user");

const {
  generateUsername,
  generatePassword,
  generateHashedPassword,
  userFound,
  userOwnAccount,
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

exports.listUsersService = async (query) => {
  const { search, firstName, lastName, username, email, role } = query;

  const contains = (value) => ({ contains: value, mode: "insensitive" });

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
      ...(firstName && { firstName: contains(firstName) }),
      ...(lastName && { lastName: contains(lastName) }),
      ...(username && { username: contains(username) }),
      ...(email && { email: contains(email) }),
      ...(role && { role }),
    },
    select: SAFE_USER_SELECT,
    orderBy: { id: "asc" },
  });

  return users;
};

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
