const { prisma } = require("../prisma");

function resolveReadAction(entityId, hasFilters) {
  if (entityId) return "READ";
  return hasFilters ? "SEARCH" : "LIST";
}

module.exports = (entity) => (req, res, next) => {
  const entityId = req.validated.params?.id;
  const { limit, cursor, ...filters } = req.validated?.query ?? {};
  const hasFilters = Object.keys(filters).length > 0;

  res.on("finish", () => {
    if (res.statusCode !== 200) return; // solo consultas exitosas

    prisma.readsLog
      .create({
        data: {
          actorId: req.user.id,
          action: resolveReadAction(entityId, hasFilters),
          entity,
          entityId,
          query: hasFilters ? filters : undefined,
          ip: req.ip,
        },
      })
      .catch((err) => console.error("Access log failed:", err));
  });

  next();
};
