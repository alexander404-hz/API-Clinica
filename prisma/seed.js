const bcrypt = require("bcryptjs");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const userSeed = [
  {
    name: "Ana Garcia",
    email: "ana.garcia@example.com",
    password: "Password123!",
    role: "ADMIN",
  },
  {
    name: "Carlos Lopez",
    email: "carlos.lopez@example.com",
    password: "Password123!",
    role: "DOCTOR",
  },
  {
    name: "Maria Rodriguez",
    email: "maria.rodriguez@example.com",
    password: "Password123!",
    role: "PATIENT",
  },
];

const timeBlockSeed = [
  {
    startTime: "2026-09-14T09:00:00.000Z",
    endTime: "2026-09-14T10:00:00.000Z",
  },
  {
    startTime: "2026-09-14T10:00:00.000Z",
    endTime: "2026-09-14T11:00:00.000Z",
  },
  {
    startTime: "2026-09-15T09:00:00.000Z",
    endTime: "2026-09-15T10:00:00.000Z",
  },
];

const appointmentSeed = [
  {
    date: new Date("2026-09-14T09:00:00.000Z"),
    email: "carlos.lopez@example.com",
    timeBlockIndex: 0,
  },
  {
    date: new Date("2026-09-15T09:00:00.000Z"),
    email: "maria.rodriguez@example.com",
    timeBlockIndex: 2,
  },
];

async function main() {
  const users = {};

  for (const userData of userSeed) {
    const password = await bcrypt.hash(userData.password, 10);
    users[userData.email] = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        password,
        role: userData.role,
      },
      create: {
        name: userData.name,
        email: userData.email,
        password,
        role: userData.role,
      },
    });
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.appointment.deleteMany();
    await transaction.timeBlock.deleteMany();

    await transaction.timeBlock.createMany({
      data: timeBlockSeed.map(({ startTime, endTime }) => ({
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      })),
    });

    const createdTimeBlocks = await transaction.timeBlock.findMany({
      orderBy: { id: "asc" },
    });

    await transaction.appointment.createMany({
      data: appointmentSeed.map(({ date, email, timeBlockIndex }) => ({
        date,
        userId: users[email].id,
        timeBlockId: createdTimeBlocks[timeBlockIndex].id,
      })),
    });
  });

  const [totalUsers, totalTimeBlocks, totalAppointments] = await Promise.all([
    prisma.user.count(),
    prisma.timeBlock.count(),
    prisma.appointment.count(),
  ]);

  console.log(
    `Seed completado. Usuarios: ${totalUsers}, bloques: ${totalTimeBlocks}, citas: ${totalAppointments}`,
  );
}

main()
  .catch((error) => {
    console.error("Error ejecutando el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
