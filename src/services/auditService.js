const { prisma } = require("../prisma");

const { paginate } = require("../utils/paginate");

const {
  READS_LOGS_BASE_SELECT,
  CHANGES_LOGS_BASE_SELECT,
} = require("../constants/audit");

const {
  buildRangeFilter,
  contains,
  buildSearchConditions,
} = require("../helpers/commonHelpers");

exports.listLogsService = async (query, audit) => {
  const { search, actorId, actorRole, action, entity, entityId } = query;
  const { ip, createdFrom, createdTo, hasActor, limit, cursor } = query;

  const logsFilters = {
    actorId,
    action: { in: action },
    actor: actorRole ? { role: { in: actorRole } } : undefined,
    entity: { in: entity },
    entityId,
    ip: contains(ip),
    createdAt: buildRangeFilter(createdFrom, createdTo),
  };

  const searchFields = [
    "actor.firstName",
    "actor.lastName",
    "actor.username",
    "actor.email",
  ];

  const conditions = buildSearchConditions(search, searchFields);

  if (hasActor !== undefined) {
    conditions.push({ actorId: hasActor ? { not: null } : null });
  }

  const isReadsLogs = audit === "reads";
  const auditLogs = isReadsLogs ? prisma.readsLog : prisma.changesLog;

  const logs = await paginate(auditLogs, {
    where: {
      ...logsFilters,
      AND: conditions,
    },
    select: isReadsLogs ? READS_LOGS_BASE_SELECT : CHANGES_LOGS_BASE_SELECT,
    orderBy: { id: "desc" },
    limit,
    cursor,
  });

  return logs;
};
