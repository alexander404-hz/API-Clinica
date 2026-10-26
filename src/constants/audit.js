const { Prisma, ReadAction, ChangeAction } = require("../prisma");
const modelNames = Prisma.dmmf.datamodel.models.map((model) => model.name);

const { USER_BASE_SELECT } = require("./user");

exports.VALID_MODEL_NAMES = Object.values(modelNames);
exports.VALID_READ_ACTIONS = Object.values(ReadAction);
exports.VALID_CHANGE_ACTIONS = Object.values(ChangeAction);

exports.READS_LOGS_BASE_SELECT = Object.freeze({
  id: true,
  actor: { select: USER_BASE_SELECT },
  action: true,
  entity: true,
  entityId: true,
  query: true,
  ip: true,
  createdAt: true,
});

exports.CHANGES_LOGS_BASE_SELECT = Object.freeze({
  id: true,
  actor: { select: USER_BASE_SELECT },
  action: true,
  entity: true,
  entityId: true,
  changes: true,
  ip: true,
  createdAt: true,
});
