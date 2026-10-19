const { prisma, Role } = require("../prisma");
const { ADMIN } = Role;

const { USER_DETAILS_SELECT } = require("../constants/user");
const { prepareNewUserService } = require("./userService");

exports.createAdminService = async (data) => {
  const { userData, tempPassword } = await prepareNewUserService(prisma, data);

  const newAdmin = await prisma.user.create({
    data: {
      ...userData,
      role: ADMIN,
    },
    select: USER_DETAILS_SELECT,
  });

  console.log(tempPassword); // simula enviar la contraseña temporal por correo

  return newAdmin;
};

//flattenUser(newPatient)
