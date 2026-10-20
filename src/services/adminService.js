const { prisma, Role } = require("../prisma");
const { ADMIN } = Role;

const { USER_DETAILS_SELECT } = require("../constants/user");
const { prepareNewUserService } = require("./userService");
const { assertNotSelf } = require("../helpers/userHelpers");
const { withAudit } = require("../utils/whithAudit");

exports.createAdminService = async (data, currentUserId, ip) => {
  const { userData, tempPassword } = await prepareNewUserService(prisma, data);

  const actor = { id: currentUserId, ip };

  const newAdmin = await withAudit(actor, async (tx) => {
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

  await withAudit(actor, async (tx) => {
    await tx.user.update({
      where: { id, deletedAt: null, role: ADMIN },
      data: { deletedAt: new Date(), isActive: false },
    });
  });
};
