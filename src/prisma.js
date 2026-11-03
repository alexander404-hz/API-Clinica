const {
  PrismaClient,
  Prisma,
  AppointmentStatus,
  Role,
  ReadAction,
  ChangeAction,
} = require("../generated/prisma");

const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});
pool.on("connect", () => console.log(`[db] conexión nueva (total: ${pool.totalCount})`));
pool.on("remove", () => console.log(`[db] conexión cerrada (total: ${pool.totalCount})`));

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
  log: [{ emit: "event", level: "query" }],
});
prisma.$on("query", (e) => {
  if (e.duration > 1000) console.log(`[db] consulta lenta ${e.duration}ms: ${e.query.slice(0, 150)}`);
});

module.exports = {
  prisma,
  Prisma,
  AppointmentStatus,
  Role,
  ReadAction,
  ChangeAction,
};
