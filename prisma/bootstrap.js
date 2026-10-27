/**
 * Bootstrap de usuarios esenciales del sistema.
 *
 * Ubicación sugerida: prisma/bootstrap.js
 * Ejecutar:           npm run db:bootstrap
 *
 * Crea (de forma idempotente, sin pisar datos existentes):
 *   1. Usuario "system": cuenta interna para jobs/procesos automáticos.
 *      No puede iniciar sesión (inactiva y con contraseña aleatoria descartada).
 *   2. Primer administrador, con mustChangePassword = true.
 *
 * Si ya existe un ADMIN, no se crean ni se exigen credenciales para otro.
 *
 * Requiere que exista el valor SYSTEM en el enum Role (migración aplicada
 * y cliente regenerado con `prisma generate`).
 *
 * Variables de entorno (solo para el admin):
 *   DATABASE_URL            (obligatoria)
 *   SEED_ADMIN_USERNAME     (obligatoria salvo NODE_ENV=development; dev: "ADMIN")
 *   SEED_ADMIN_EMAIL        (obligatoria salvo NODE_ENV=development; dev: "admin@example.com")
 *   SEED_ADMIN_PASSWORD     (obligatoria salvo NODE_ENV=development; dev: "1234")
 *   SEED_ADMIN_FIRST_NAME   (opcional, default "Admin")
 *   SEED_ADMIN_LAST_NAME    (opcional, default "Sistema")
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

// Solo NODE_ENV=development habilita valores por defecto. Cualquier otro valor
// (production, test, o variable ausente) exige credenciales explícitas.
const IS_DEV = process.env.NODE_ENV === 'development';
const BCRYPT_ROUNDS = 12;

// Username fijo: los jobs buscan este usuario por username, nunca por id.
const SYSTEM_USERNAME = 'system';

function requireEnv(name, devFallback) {
  const value = process.env[name];
  if (value && value.trim() !== '') return value.trim();
  if (IS_DEV && devFallback !== undefined) return devFallback;
  throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
}

async function bootstrapSystemUser() {
  const existing = await prisma.user.findUnique({ where: { username: SYSTEM_USERNAME } });
  if (existing) {
    console.log(`✔ Usuario "${SYSTEM_USERNAME}" ya existe, se omite.`);
    return;
  }

  // Contraseña aleatoria que nadie conoce: la cuenta no es utilizable para login.
  const unusablePassword = await bcrypt.hash(
    crypto.randomBytes(64).toString('hex'),
    BCRYPT_ROUNDS,
  );

  await prisma.user.create({
    data: {
      firstName: 'Sistema',
      lastName: 'Interno',
      role: 'SYSTEM',
      username: SYSTEM_USERNAME,
      email: 'system@internal.invalid', // TLD reservado: nunca será un correo real
      password: unusablePassword,
      isActive: false,
      mustChangePassword: false,
    },
  });

  console.log(`✔ Usuario "${SYSTEM_USERNAME}" creado (sin acceso de login).`);
}

async function bootstrapAdmin() {
  // Si ya existe un administrador, no se piden credenciales ni se crea otro.
  // Así el script puede correr en cada despliegue sin SEED_ADMIN_* configuradas.
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });
  if (existingAdmin) {
    console.log('✔ Ya existe un administrador, se omite.');
    return;
  }

  const username = requireEnv('SEED_ADMIN_USERNAME', 'ADMIN');
  const email = requireEnv('SEED_ADMIN_EMAIL', 'admin@example.com').toLowerCase();
  const password = requireEnv('SEED_ADMIN_PASSWORD', '1234');
  const firstName = process.env.SEED_ADMIN_FIRST_NAME || 'Super';
  const lastName = process.env.SEED_ADMIN_LAST_NAME || 'Admin';

  if (!IS_DEV && password.length < 6) {
    throw new Error('SEED_ADMIN_PASSWORD debe tener al menos 6 caracteres fuera de desarrollo.');
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    // No se sobrescribe contraseña ni datos existentes.
    console.log(`✔ Admin "${username}" ya existe, se omite.`);
    return;
  }

  await prisma.user.create({
    data: {
      firstName,
      lastName,
      role: 'ADMIN',
      username,
      email,
      password: await bcrypt.hash(password, BCRYPT_ROUNDS),
      isActive: true,
      mustChangePassword: true,
    },
  });

  console.log(`✔ Admin "${username}" creado (deberá cambiar su contraseña al iniciar sesión).`);
}

async function main() {
  await bootstrapSystemUser();
  await bootstrapAdmin();
}

main()
  .catch((err) => {
    console.error('❌ Error en bootstrap:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });