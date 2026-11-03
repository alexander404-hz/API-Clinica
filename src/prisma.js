const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const {
  PrismaClient,
  Prisma,
  AppointmentStatus,
  Role,
  ReadAction,
  ChangeAction,
} = require("../generated/prisma");

// Conexión DIRECTA a Prisma Postgres (db.prisma.io).
// El pooler (pooled.db.prisma.io) tardaba de 18 a 110 s en la primera consulta
// después de un par de minutos sin uso, así que la app usa la directa.
// El plan Free deja 5 conexiones directas para todo: API, migraciones y Studio.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3, // conexiones simultáneas máximas de esta API
  idleTimeoutMillis: 30_000, // libera conexiones inactivas a los 30 s
  connectionTimeoutMillis: 10_000, // error si conseguir una conexión tarda más de 10 s
});

// Muestra en los logs si una conexión inactiva se cae
pool.on("error", (err) => {
  console.error("[db] error en conexión inactiva:", err.message);
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
  log: [{ emit: "event", level: "query" }],
});

// Aviso si alguna consulta vuelve a tardar demasiado
prisma.$on("query", (e) => {
  if (e.duration > 2000) {
    console.warn(`[db] consulta lenta ${e.duration}ms: ${e.query.slice(0, 150)}`);
  }
});

module.exports = {
  prisma,
  Prisma,
  AppointmentStatus,
  Role,
  ReadAction,
  ChangeAction,
};