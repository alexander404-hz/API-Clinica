/**
 * Seed idempotente (sin usuarios admin: ver bootstrap.js).
 *
 * Ubicación sugerida: prisma/seed.js
 * Ejecutar:           npm run seed
 *
 * Siempre (dev y prod):
 *   - TimeBlocks (bloques de 30 min: 08:00-12:00 y 13:00-17:00)
 *
 * Solo en desarrollo (NODE_ENV === 'development'):
 *   - Pacientes de ejemplo y citas de ejemplo
 *
 * Variables de entorno:
 *   DATABASE_URL        (obligatoria)
 *   SEED_DEV_PASSWORD   (opcional, solo dev, default "1234")
 */

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

// Los datos de ejemplo solo se crean si NODE_ENV es exactamente 'development'.
const IS_DEV = process.env.NODE_ENV === 'development';
const BCRYPT_ROUNDS = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeOnly(hours, minutes = 0) {
  // Columna @db.Time(0): se guarda solo la hora, la fecha es irrelevante.
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

// ---------------------------------------------------------------------------
// TimeBlocks (dev + prod)
// ---------------------------------------------------------------------------

function buildTimeBlocks() {
  const ranges = [
    { from: [8, 0], to: [12, 0] },
    { from: [13, 0], to: [17, 0] },
  ];
  const stepMinutes = 30;
  const blocks = [];

  for (const { from, to } of ranges) {
    let current = timeOnly(...from);
    const end = timeOnly(...to);
    while (current < end) {
      const next = addMinutes(current, stepMinutes);
      blocks.push({ startTime: current, endTime: next });
      current = next;
    }
  }
  return blocks;
}

async function seedTimeBlocks() {
  const blocks = buildTimeBlocks();
  let created = 0;

  for (const block of blocks) {
    // TimeBlock no tiene unique, así que se verifica manualmente para ser idempotente.
    const exists = await prisma.timeBlock.findFirst({
      where: { startTime: block.startTime, endTime: block.endTime },
      select: { id: true },
    });
    if (!exists) {
      await prisma.timeBlock.create({ data: block });
      created++;
    }
  }

  console.log(`✔ TimeBlocks: ${created} creados, ${blocks.length - created} ya existían.`);
}

// ---------------------------------------------------------------------------
// Datos de ejemplo (solo dev)
// ---------------------------------------------------------------------------

const DEV_PATIENTS = [
  {
    firstName: 'María',
    lastName: 'Hernández',
    username: 'maria.hernandez',
    email: 'maria.hernandez@example.com',
    preferredName: 'Mary',
    insuranceNumber: 'INS-0001',
  },
  {
    firstName: 'Carlos',
    lastName: 'Ramírez',
    username: 'carlos.ramirez',
    email: 'carlos.ramirez@example.com',
    preferredName: null,
    insuranceNumber: 'INS-0002',
  },
  {
    firstName: 'Ana',
    lastName: 'López',
    username: 'ana.lopez',
    email: 'ana.lopez@example.com',
    preferredName: 'Anita',
    insuranceNumber: 'INS-0003',
  },
  {
    firstName: 'José',
    lastName: 'Martínez',
    username: 'jose.martinez',
    email: 'jose.martinez@example.com',
    preferredName: null,
    insuranceNumber: 'INS-0004',
  },
];

async function seedDevPatients() {
  const password = process.env.SEED_DEV_PASSWORD || '1234';
  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const patients = [];

  for (const p of DEV_PATIENTS) {
    const existing = await prisma.user.findUnique({
      where: { username: p.username },
      include: { patientProfile: true },
    });

    if (existing) {
      patients.push(existing.patientProfile);
      continue;
    }

    // Crea User + Patient en una sola operación (Patient.id == User.id)
    const user = await prisma.user.create({
      data: {
        firstName: p.firstName,
        lastName: p.lastName,
        role: 'PATIENT',
        username: p.username,
        email: p.email,
        password: hashed,
        mustChangePassword: false,
        patientProfile: {
          create: {
            preferredName: p.preferredName,
            insuranceNumber: p.insuranceNumber,
          },
        },
      },
      include: { patientProfile: true },
    });

    patients.push(user.patientProfile);
  }

  console.log(`✔ [dev] Pacientes de ejemplo listos: ${patients.length}.`);
  return patients;
}

async function seedDevAppointments(patients) {
  // El admin lo crea bootstrap.js; si aún no existe, statusChangedById queda null.
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
  const blocks = await prisma.timeBlock.findMany({ orderBy: { startTime: 'asc' } });
  if (blocks.length === 0 || patients.length === 0) return;

  let created = 0;

  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];

    const alreadyHas = await prisma.appointment.count({ where: { patientId: patient.id } });
    if (alreadyHas > 0) continue;

    const block = blocks[(i * 3) % blocks.length];

    // Fecha base a las 00:00 UTC de "hoy"
    const today = new Date();
    const baseDay = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

    const makeDate = (dayOffset, time) =>
      new Date(
        baseDay +
          dayOffset * 24 * 60 * 60 * 1000 +
          time.getUTCHours() * 60 * 60 * 1000 +
          time.getUTCMinutes() * 60 * 1000,
      );

    // Una cita futura programada
    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        startsAt: makeDate(i + 1, block.startTime),
        endsAt: makeDate(i + 1, block.endTime),
        status: 'SCHEDULED',
      },
    });

    // Una cita pasada con estado variado
    const pastStatuses = ['COMPLETED', 'NO_SHOW', 'CANCELLED', 'COMPLETED'];
    const pastStatus = pastStatuses[i % pastStatuses.length];

    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        startsAt: makeDate(-(i + 2), block.startTime),
        endsAt: makeDate(-(i + 2), block.endTime),
        status: pastStatus,
        statusChangedAt: makeDate(-(i + 2), block.endTime),
        statusChangedById: admin ? admin.id : null,
      },
    });

    created += 2;
  }

  console.log(`✔ [dev] Citas de ejemplo creadas: ${created}.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`🌱 Ejecutando seed (${IS_DEV ? 'desarrollo' : 'sin datos de ejemplo'})...`);

  await seedTimeBlocks();

  if (IS_DEV) {
    const patients = await seedDevPatients();
    await seedDevAppointments(patients);
  } else {
    console.log('ℹ NODE_ENV no es development: se omiten datos de ejemplo.');
  }

  console.log('✅ Seed finalizado.');
}

main()
  .catch((err) => {
    console.error('❌ Error en el seed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });