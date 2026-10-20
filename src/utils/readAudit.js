const { prisma } = require("../prisma");

exports.auditRead = (entity) => (req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode !== 200) return; // solo consultas exitosas

    prisma.accessLog
      .create({
        data: {
          actorId: String(req.user.id),
          entity,
          entityId: req.params.id ?? null,
          query: Object.keys(req.query).length ? req.query : undefined,
          ip: req.ip,
        },
      })
      .catch((err) => console.error("Access log failed:", err));
  });

  next();
};
