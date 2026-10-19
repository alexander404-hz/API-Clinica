const {
  PrismaClient,
  AppointmentStatus,
  Role,
} = require("../generated/prisma");

const prisma = new PrismaClient();

module.exports = { prisma, AppointmentStatus, Role };
