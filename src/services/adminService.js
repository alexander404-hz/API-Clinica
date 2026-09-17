const { PrismaClient } = require("../../generated/prisma");
const prisma = new PrismaClient();

const createTimeBlockService = async (startTime, endTime) => {
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