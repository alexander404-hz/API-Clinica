const { PrismaClient } = require("../../generated/prisma");
const prisma = new PrismaClient();

exports.createAppointmentService = async (data) => {
  const conflict = await prisma.appointment.findFirst({
    where: {
      date: data.date,
      timeBlockId: data.timeBlockId,
    },
  });

  if (conflict) {
    throw new Error("El horario ya esta ocupado");
  }

  const newAppointment = prisma.appointment.create({ data });

  return newAppointment;
};

exports.getAppointmentService = async (id) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: parseInt(id, 10) },
  });

  return appointment;
};

exports.updateAppointmentService = async (id, data) => {
  const conflict = await prisma.appointment.findFirst({
    where: {
      date: data.date,
      timeBlockId: data.timeBlockId,
      id: { not: parseInt(id, 10) },
    },
  });

  if (conflict) {
    throw new Error("El horario ya esta ocupado");
  }

  const updatedAppointment = prisma.appointment.update({
    where: { id: parseInt(id, 10) },
    data,
  });

  return updatedAppointment;
};

exports.deleteAppointmentService = (id) => {
  const deletedAppointment = prisma.appointment.delete({
    where: { id: parseInt(id, 10) },
  });
};