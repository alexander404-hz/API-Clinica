// prisma/seed.js
const bcrypt = require("bcryptjs");
const {
  PrismaClient,
  Role,
  AppointmentStatus,
} = require("../generated/prisma");

const prisma = new PrismaClient();

const CLINIC_TIME_ZONE = "America/El_Salvador";
const CLINIC_TZ_OFFSET = "-06:00";
const DEFAULT_PASSWORD = "1234";

const { SCHEDULED, CANCELLED, COMPLETED, NO_SHOW } = AppointmentStatus;

const pad = (n) => String(n).padStart(2, "0");

// Hora de pared de la clínica -> instante (Date), sumando `days` días a hoy
const localInstant = (days, hour, minute = 0) => {
  const todayLocal = new Date(
    new Date().toLocaleDateString("en-CA", { timeZone: CLINIC_TIME_ZONE }),
  ); // medianoche UTC del día local actual
  todayLocal.setUTCDate(todayLocal.getUTCDate() + days);
  const dateStr = todayLocal.toISOString().slice(0, 10);

  const base = new Date(`${dateStr}T00:00:00${CLINIC_TZ_OFFSET}`);
  return new Date(base.getTime() + (hour * 60 + minute) * 60 * 1000);
};

// Hora de pared recurrente para columnas @db.Time(0)
const timeOnly = (hour, minute = 0) =>
  new Date(`1970-01-01T${pad(hour)}:${pad(minute)}:00.000Z`);

const buildTimeBlocks = () => {
  const blocks = [];
  // 9:00-12:00 y 14:00-17:00, bloques de 30 minutos
  for (const [from, to] of [
    [9, 12],
    [14, 17],
  ]) {
    for (let minutes = from * 60; minutes < to * 60; minutes += 30) {
      const end = minutes + 30;
      blocks.push({
        startTime: timeOnly(Math.floor(minutes / 60), minutes % 60),
        endTime: timeOnly(Math.floor(end / 60), end % 60),
      });
    }
  }
  return blocks;
};

async function main() {
  console.log("Limpiando tablas...");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "Appointment", "Patient", "TimeBlock", "User" RESTART IDENTITY CASCADE`,
  );

  const password = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  console.log("Creando usuarios...");
  const admin = await prisma.user.create({
    data: {
      firstName: "Admin",
      lastName: "Clinica",
      username: "admin",
      email: "admin@clinica.test",
      password,
      role: Role.ADMIN,
    },
  });

  const patientsData = [
    {
      firstName: "Ana",
      lastName: "Martinez",
      username: "ana",
      insuranceNumber: "INS-0001",
      preferredName: "Anita",
    },
    {
      firstName: "Carlos",
      lastName: "Lopez",
      username: "carlos",
      insuranceNumber: "INS-0002",
    },
    {
      firstName: "Lucia",
      lastName: "Hernandez",
      username: "lucia",
      insuranceNumber: "INS-0003",
    },
  ];

  const patients = [];
  for (const { insuranceNumber, preferredName, ...user } of patientsData) {
    const created = await prisma.user.create({
      data: {
        ...user,
        email: `${user.username}@clinica.test`,
        password,
        role: Role.PATIENT,
        patientProfile: {
          create: { insuranceNumber, preferredName },
        },
      },
    });
    patients.push(created);
  }
  const [ana, carlos, lucia] = patients;

  console.log("Creando bloques de horario...");
  await prisma.timeBlock.createMany({ data: buildTimeBlocks() });

  console.log("Creando citas...");
  const appointment = (patientId, days, hour, minute, status, extra = {}) => ({
    patientId,
    startsAt: localInstant(days, hour, minute),
    endsAt: localInstant(days, hour, minute + 30),
    status,
    ...extra,
  });

  await prisma.appointment.createMany({
    data: [
      // Futuras, dentro de la ventana de cancelación (se pueden cancelar)
      appointment(ana.id, 5, 9, 0, SCHEDULED),
      appointment(carlos.id, 7, 10, 30, SCHEDULED),
      appointment(lucia.id, 10, 14, 0, SCHEDULED),

      // Próximas, fuera de la ventana (menos de 3 días: no se pueden cancelar)
      appointment(ana.id, 1, 15, 0, SCHEDULED),
      appointment(carlos.id, 2, 11, 0, SCHEDULED),

      // Pasada sin marcar (para probar complete/no-show manual y el job)
      appointment(lucia.id, -1, 9, 30, SCHEDULED),
      appointment(ana.id, -3, 14, 30, SCHEDULED),

      // Ya completadas por el admin
      appointment(ana.id, -10, 10, 0, COMPLETED, {
        statusChangedAt: localInstant(-10, 10, 45),
        statusChangedById: admin.id,
      }),
      appointment(carlos.id, -7, 9, 0, COMPLETED, {
        statusChangedAt: localInstant(-7, 9, 40),
        statusChangedById: admin.id,
      }),

      // No-show marcado por el admin
      appointment(lucia.id, -6, 15, 30, NO_SHOW, {
        statusChangedAt: localInstant(-6, 16, 15),
        statusChangedById: admin.id,
      }),

      // No-show marcado por el sistema (statusChangedById = null)
      appointment(carlos.id, -4, 11, 0, NO_SHOW, {
        statusChangedAt: localInstant(-3, 0, 5),
      }),

      // Canceladas
      appointment(ana.id, 12, 9, 30, CANCELLED, {
        statusChangedAt: localInstant(-1, 12, 0),
        statusChangedById: ana.id,
      }),
      appointment(lucia.id, 8, 16, 0, CANCELLED, {
        statusChangedAt: localInstant(-2, 8, 30),
        statusChangedById: lucia.id,
      }),
    ],
  });

  console.log("Seed completada.");
  console.log(`  Admin:     admin@clinica.test / ${DEFAULT_PASSWORD}`);
  console.log(
    `  Pacientes: ana|carlos|lucia@clinica.test / ${DEFAULT_PASSWORD}`,
  );
}

main()
  .catch((err) => {
    console.error("Seed fallida:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
