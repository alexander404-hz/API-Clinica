const {
  PrismaClient,
  Role,
  AppointmentStatus,
} = require("../generated/prisma");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Helpers para @db.Time y @db.Date
const toTime = (s) => new Date(`1970-01-01T${s}:00Z`);
const toDate = (d) => new Date(d.toISOString().slice(0, 10)); // solo el día, UTC

const daysFromNow = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return toDate(d);
};

// Genera bloques de 30 min entre dos horas (en minutos desde medianoche)
const buildBlocks = (fromMin, toMin, step = 30) => {
  const fmt = (m) =>
    `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const blocks = [];
  for (let m = fromMin; m < toMin; m += step) {
    blocks.push({ startTime: toTime(fmt(m)), endTime: toTime(fmt(m + step)) });
  }
  return blocks;
};

async function main() {
  // Limpiar y reiniciar los ids (PostgreSQL)
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "Appointment", "TimeBlock", "Patient", "User" RESTART IDENTITY CASCADE`,
  );

  const password = await bcrypt.hash("Password123!", 10);

  // ---------- Usuarios ----------
  await prisma.user.create({
    data: {
      firstName: "Ana",
      lastName: "Admin",
      username: "ana.admin",
      email: "admin@clinica.com",
      password,
      role: Role.ADMIN,
    },
  });

  const patientsData = [
    {
      firstName: "Laura",
      lastName: "Gómez",
      preferredName: "Lau",
      insuranceNumber: "INS-0001",
    },
    {
      firstName: "Carlos",
      lastName: "Pérez",
      preferredName: null,
      insuranceNumber: "INS-0002",
    },
    {
      firstName: "María",
      lastName: "López",
      preferredName: "Mary",
      insuranceNumber: "INS-0003",
    },
  ];

  const patients = [];
  for (const p of patientsData) {
    const user = await prisma.user.create({
      data: {
        firstName: p.firstName,
        lastName: p.lastName,
        username: `${p.firstName}.${p.lastName}`.toLowerCase(),
        email: `${p.firstName}.${p.lastName}@mail.com`.toLowerCase(),
        password,
        role: Role.PATIENT,
        patientProfile: {
          create: {
            preferredName: p.preferredName,
            insuranceNumber: p.insuranceNumber,
          },
        },
      },
    });
    patients.push(user); // user.id === patient.id
  }

  // Un paciente suspendido y uno eliminado (soft delete), para probar los filtros
  await prisma.user.create({
    data: {
      firstName: "Sofía",
      lastName: "Suspendida",
      username: "sofia.suspendida",
      email: "sofia@mail.com",
      password,
      role: Role.PATIENT,
      isActive: false,
      patientProfile: { create: { insuranceNumber: "INS-0004" } },
    },
  });

  await prisma.user.create({
    data: {
      firstName: "Eduardo",
      lastName: "Eliminado",
      username: "eduardo.eliminado",
      email: "eduardo@mail.com",
      password,
      role: Role.PATIENT,
      deletedAt: new Date(),
      patientProfile: { create: { insuranceNumber: "INS-0005" } },
    },
  });

  // ---------- Bloques horarios (sin solapamiento) ----------
  await prisma.timeBlock.createMany({
    data: [
      ...buildBlocks(8 * 60, 12 * 60), // 08:00 - 12:00
      ...buildBlocks(14 * 60, 17 * 60), // 14:00 - 17:00
    ],
  });

  // ---------- Citas (hora copiada, sin solapamiento entre SCHEDULED) ----------
  await prisma.appointment.createMany({
    data: [
      {
        patientId: patients[0].id,
        date: daysFromNow(-7),
        startTime: toTime("09:00"),
        endTime: toTime("09:30"),
        status: AppointmentStatus.COMPLETED,
      },
      {
        patientId: patients[1].id,
        date: daysFromNow(2),
        startTime: toTime("09:00"),
        endTime: toTime("09:30"),
        status: AppointmentStatus.SCHEDULED,
      },
      {
        patientId: patients[2].id,
        date: daysFromNow(2),
        startTime: toTime("09:30"),
        endTime: toTime("10:00"),
        status: AppointmentStatus.SCHEDULED,
      },
      {
        patientId: patients[0].id,
        date: daysFromNow(3),
        startTime: toTime("14:00"),
        endTime: toTime("14:30"),
        status: AppointmentStatus.SCHEDULED,
      },
      {
        // Cancelada: mismo horario que la de arriba sin chocar,
        // porque la constraint solo considera las SCHEDULED
        patientId: patients[1].id,
        date: daysFromNow(3),
        startTime: toTime("14:00"),
        endTime: toTime("14:30"),
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    ],
  });

  console.log("✅ Seed completado");
  console.log(
    "   Credenciales: cualquier email del seed con la contraseña Password123!",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
