const {
  PrismaClient,
  Prisma,
  AppointmentStatus,
  Role,
  ReadAction,
  ChangeAction,
} = require("../generated/prisma");

const prisma = new PrismaClient();

module.exports = {
  prisma,
  Prisma,
  AppointmentStatus,
  Role,
  ReadAction,
  ChangeAction,
};
