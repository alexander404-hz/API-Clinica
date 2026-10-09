const AppError = require("../utils/AppError");
const { CONFLICT } = require("../constants/errorCodes");

const formatTime = (date) => date.toISOString().slice(11, 16);

exports.assertNoOverlap = async (tx, startTime, endTime, excludedId) => {
  const overlapping = await tx.timeBlock.findFirst({
    where: {
      ...(excludedId && { id: { not: excludedId } }),
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (overlapping) {
    const start = formatTime(overlapping.startTime);
    const end = formatTime(overlapping.endTime);

    throw new AppError(
      `Overlaps with the time block ${start}-${end}.`,
      409,
      CONFLICT,
    );
  }
};

exports.serialize = (block) => ({
  id: block.id,
  startTime: formatTime(block.startTime),
  endTime: formatTime(block.endTime),
});

exports.generateTimeBlocks = (start, end, duration) => {
  const generatedTimeBlocks = [];

  let startTime = start;

  const sumDateTime = (a, b) => new Date(a.getTime() + b.getTime());

  while (sumDateTime(startTime, duration) < end) {
    const timeBlock = {};

    timeBlock.startTime = startTime;
    timeBlock.endTime = sumDateTime(startTime, duration);

    generatedTimeBlocks.push(timeBlock);

    startTime = timeBlock.endTime;
  }

  return generatedTimeBlocks;
};
