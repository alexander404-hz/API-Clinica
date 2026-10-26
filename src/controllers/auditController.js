const { listLogsService } = require("../services/auditService");

exports.listReadsLogs = async (req, res) => {
  const readsLogs = await listLogsService(req.validated.query, "reads");
  res.status(200).json(readsLogs);
};

exports.listChangesLogs = async (req, res) => {
  const changesLogs = await listLogsService(req.validated.query, "changes");
  res.status(200).json(changesLogs);
};
