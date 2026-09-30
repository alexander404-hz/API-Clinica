const bcrypt = require("bcryptjs");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const userSeed = [
  { 
    firstName: "Ana",
    lastName: "Garcia",
    username: "AG19001",
    email: "ana.garcia@example.com",
    password: "Password123!",
    role: "ADMIN",
  },
  {
    firstName: "Carlos",
    lastName: "Lopez",
    username: "CL21005",
    email: "carlos.lopez@example.com",
    password: "Password123!",
    role: "PATIENT",
    insuranceNumber: "INS-0001",
  },
  {
    firstName: "Maria",
    lastName: "Rodriguez",
    username: "MR18039",
    email: "maria.rodriguez@example.com",
    password: "Password123!",
    role: "PATIENT",
    insuranceNumber: "INS-0002",
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
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        password,
        role: userData.role,
      },
      create: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        email: userData.email,
        password,
        role: userData.role,
        ...(userData.role === "PATIENT" && {
          patientProfile: {
            create: { insuranceNumber: userData.insuranceNumber ?? null },
          },
        }),
      },
    });

    if (userData.role === "PATIENT") {
      await prisma.patient.upsert({
        where: { id: users[userData.email].id },
        update: { insuranceNumber: userData.insuranceNumber ?? null },
        create: {
          id: users[userData.email].id,
          insuranceNumber: userData.insuranceNumber ?? null,
        },
      });
    }
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
        patientId: users[email].id,
        timeBlockId: createdTimeBlocks[timeBlockIndex].id,
      })),
    });
  });

  const [totalUsers, totalPatients, totalTimeBlocks, totalAppointments] =
    await Promise.all([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.timeBlock.count(),
      prisma.appointment.count(),
    ]);

  console.log(
    `Seed completado. Usuarios: ${totalUsers}, pacientes: ${totalPatients}, bloques: ${totalTimeBlocks}, citas: ${totalAppointments}`,
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
