// utils/withAudit.js
const { prisma } = require("../prisma");

// Ejecuta fn dentro de una transacción que le dice a la DB quién actúa.
// "true" en set_config hace que la variable viva solo en esta transacción.
exports.withAudit = (actor, fn) =>
  prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT set_config('app.user_id', ${String(actor.id)}, true),
             set_config('app.ip', ${actor.ip ?? ""}, true)
    `;
    return fn(tx);
  });
