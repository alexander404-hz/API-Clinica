const {
  PrismaClient,
  Prisma,
  AppointmentStatus,
  Role,
  ReadAction,
  ChangeAction,
} = require("../generated/prisma");

const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

const prisma = new PrismaClient({ adapter });

module.exports = {
  prisma,
  Prisma,
  AppointmentStatus,
  Role,
  ReadAction,
  ChangeAction,
};
