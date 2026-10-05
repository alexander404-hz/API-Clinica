const { PrismaClient } = require("../../generated/prisma");
const prisma = new PrismaClient();

const { prepareNewUserService } = require("./userService");
const { SAFE_USER_SELECT } = require("../constants/user");

const {
  ROLES: { ADMIN },
} = require("../constants/roles");

exports.createAdminService = async (data) => {
  const { userData, tempPassword } = await prepareNewUserService(data);

  const newAdmin = await prisma.user.create({
    data: {
      ...userData,
      role: ADMIN,
    },
    select: SAFE_USER_SELECT,
  });

  console.log(tempPassword); // simula enviar la contraseña temporal por correo

  return newAdmin;
};

exports.createTimeBlockService = async (data) => {
  const { startTime, endTime } = data;

  const newTimeBlock = await prisma.timeBlock.create({
    data: {
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    },
  });

  return newTimeBlock;
};

exports.listAppointmentsService = async () => {
  const appointments = await prisma.appointment.findMany({
    include: {
      user: true,
      timeBlock: true,
    },
  });

  return appointments;
};
