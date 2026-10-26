const { prisma, Role } = require("../prisma");
const { ADMIN } = Role;

const auditChanges = require("../utils/auditChanges");
const { USER_DETAILS_SELECT } = require("../constants/user");
const { prepareNewUserService } = require("./userService");
const { assertNotSelf, assertUserUpdated } = require("../helpers/userHelpers");

exports.createAdminService = async (data, currentUserId, ip) => {
  const { userData, tempPassword } = await prepareNewUserService(prisma, data);

  const actor = { id: currentUserId, ip };

  const newAdmin = await auditChanges(actor, async (tx) => {
    return await tx.user.create({
      data: {
        ...userData,
        role: ADMIN,
      },
      select: USER_DETAILS_SELECT,
    });
  });

  console.log(tempPassword); // simula enviar la contraseña temporal por correo

  return newAdmin;
};

exports.deleteAdminService = async (id, currentUserId, ip) => {
  assertNotSelf(id, currentUserId, "delete");

  const actor = { id: currentUserId, ip };

  await auditChanges(actor, async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id, deletedAt: null, role: ADMIN },
      data: { deletedAt: new Date(), isActive: false },
    });

    assertUserUpdated(count, "Admin");
  });
};
