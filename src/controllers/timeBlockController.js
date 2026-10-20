const {
  listAvailableTimeBlocksService,
  createTimeBlockService,
  getTimeBlockService,
  listTimeBlocksService,
  updateTimeBlockService,
  deleteTimeBlockService,
  generateTimeBlocksService,
} = require("../services/timeBlockService");

exports.listAvailableTimeBlocks = async (req, res) => {
  const availableTimeBlocks = await listAvailableTimeBlocksService(
    req.validated.query.date,
    req.user,
  );
  res.status(200).json(availableTimeBlocks);
};

exports.generateTimeBlocks = async (req, res) => {
  const newTimeBlocks = await generateTimeBlocksService(
    req.validated.body,
    req.user.id,
    req.ip,
  );
  res.status(201).json(newTimeBlocks);
};

exports.createTimeBlock = async (req, res) => {
  const newTimeBlock = await createTimeBlockService(
    req.validated.body,
    req.user.id,
    req.ip,
  );
  res.status(201).json(newTimeBlock);
};

exports.getTimeBlock = async (req, res) => {
  const timeBlock = await getTimeBlockService(req.validated.params.id);
  res.status(200).json(timeBlock);
};

exports.listTimeBlocks = async (req, res) => {
  const timeBlocks = await listTimeBlocksService();
  res.status(200).json(timeBlocks);
};

exports.updateTimeBlock = async (req, res) => {
  const updatedTimeBlock = await updateTimeBlockService(
    req.validated.params.id,
    req.validated.body,
    req.user.id,
    req.ip,
  );
  res.status(200).json(updatedTimeBlock);
};

exports.deleteTimeBlock = async (req, res) => {
  await deleteTimeBlockService(req.validated.params.id, req.user.id, req.ip);
  res.status(204).send();
};
