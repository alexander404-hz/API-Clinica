const prisma = require("../prisma");
const {
  assertNoOverlap,
  serialize,
  generateTimeBlocks,
} = require("../helpers/timeBlockHelpers");
const { assertFound } = require("../helpers/commonHelpers");

const {
  STATUS: { SCHEDULED },
} = require("../constants/AppointmentStatus");

exports.createTimeBlockService = async (data) => {
  const { startTime, endTime } = data;

  const newTimeBlock = await prisma.$transaction(async (tx) => {
    await assertNoOverlap(tx, startTime, endTime);

    const created = await tx.timeBlock.create({
      data: { startTime, endTime },
    });

    return created;
  });

  return serialize(newTimeBlock);
};

exports.getTimeBlockService = async (id) => {
  const timeBlock = await prisma.timeBlock.findUnique({
    where: { id },
  });

  assertFound(timeBlock, "TimeBlock");

  return serialize(timeBlock);
};

exports.listTimeBlocksService = async () => {
  const timeBlocks = await prisma.timeBlock.findMany({
    orderBy: { startTime: "asc" },
  });

  return timeBlocks.map(serialize);
};

exports.updateTimeBlockService = async (id, data) => {
  const { startTime, endTime } = data;

  const updatedTimeBlock = await prisma.$transaction(async (tx) => {
    const current = await tx.timeBlock.findUnique({
      where: { id },
    });

    assertFound(current, "TimeBlock");

    const start = startTime ?? current.startTime;
    const end = endTime ?? current.endTime;

    await assertNoOverlap(tx, start, end, id);

    const updated = await tx.timeBlock.update({
      where: { id },
      data: { startTime, endTime },
    });

    return updated;
  });

  return serialize(updatedTimeBlock);
};

exports.deleteTimeBlockService = async (id) => {
  await prisma.timeBlock.delete({
    where: { id },
  });
};

exports.listAvailableTimeBlocksService = async (date) => {
  const [timeBlocks, appointments] = await Promise.all([
    prisma.timeBlock.findMany({
      orderBy: { startTime: "asc" },
    }),
    prisma.appointment.findMany({
      where: { date, status: SCHEDULED },
    }),
  ]);

  const availableTimeBlocks = timeBlocks.filter(
    (timeBlock) =>
      !appointments.some(
        (appointment) =>
          timeBlock.startTime < appointment.endTime &&
          timeBlock.endTime > appointment.startTime,
      ),
  );

  return availableTimeBlocks.map(serialize);
};

exports.generateTimeBlocksService = async (data) => {
  const { startTime, endTime, duration, clear = false, replace = false } = data;

  const generatedTimeBlocks = generateTimeBlocks(startTime, endTime, duration);

  const newTimeBlocks = await prisma.$transaction(async (tx) => {
    if (clear) {
      await tx.timeBlock.deleteMany();
    } else if (replace) {
      await tx.timeBlock.deleteMany({
        where: { startTime: { lt: endTime }, endTime: { gt: startTime } },
      });
    } else {
      await assertNoOverlap(tx, startTime, endTime);
    }

    await tx.timeBlock.createMany({ data: generatedTimeBlocks });

    const created = await tx.timeBlock.findMany({
      where: { startTime: { gte: startTime }, endTime: { lte: endTime } },
      orderBy: { startTime: "asc" },
    });

    return created;
  });

  return newTimeBlocks.map(serialize);
};
