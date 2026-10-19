const { prisma, AppointmentStatus } = require("../prisma");
const { CANCELLED } = AppointmentStatus;

const { REPLACE_FILTER } = require("../constants/timeblock");
const { NONE, OVERLAP, ALL } = REPLACE_FILTER;

const { assertFound, getClinicDayRange } = require("../helpers/commonHelpers");

const {
  assertNoOverlap,
  serializeTimeBlock,
  generateTimeBlocks,
  getBookingWindow,
  toDayTimeBlocks,
  filterBookableTimeBlocks,
  filterAvailableTimeBlocks,
  assertDayWithinBookingWindow,
} = require("../helpers/timeBlockHelpers");

exports.createTimeBlockService = async (data) => {
  const { startTime, endTime } = data;

  await assertNoOverlap(prisma, startTime, endTime);

  const newTimeBlock = await prisma.timeBlock.create({
    data: { startTime, endTime },
  });

  return serializeTimeBlock(newTimeBlock);
};

exports.getTimeBlockService = async (id) => {
  const timeBlock = await prisma.timeBlock.findUnique({
    where: { id },
  });

  assertFound(timeBlock, "TimeBlock");

  return serializeTimeBlock(timeBlock);
};

exports.listTimeBlocksService = async () => {
  const timeBlocks = await prisma.timeBlock.findMany({
    orderBy: { startTime: "asc" },
  });

  return timeBlocks.map(serializeTimeBlock);
};

exports.updateTimeBlockService = async (id, data) => {
  const current = await prisma.timeBlock.findUnique({ where: { id } });
  assertFound(current, "TimeBlock");

  const startTime = data.startTime ?? current.startTime;
  const endTime = data.endTime ?? current.endTime;

  await assertNoOverlap(prisma, startTime, endTime, id);

  const updated = await prisma.timeBlock.update({
    where: { id },
    data: { startTime, endTime },
  });

  return serializeTimeBlock(updated);
};

exports.deleteTimeBlockService = async (id) => {
  await prisma.timeBlock.delete({
    where: { id },
  });
};

exports.listAvailableTimeBlocksService = async (date, currentUser) => {
  const { dayStart, dayEnd } = getClinicDayRange(date);
  const bookingWindow = getBookingWindow(currentUser, new Date());

  assertDayWithinBookingWindow(dayStart, dayEnd, bookingWindow);

  const [timeBlocks, appointments] = await Promise.all([
    prisma.timeBlock.findMany({ orderBy: { startTime: "asc" } }),
    prisma.appointment.findMany({
      where: {
        status: { not: CANCELLED },
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
      },
    }),
  ]);

  const dayTimeBlocks = toDayTimeBlocks(timeBlocks, dayStart);

  const bookableTimeBlocks = filterBookableTimeBlocks(
    dayTimeBlocks,
    bookingWindow,
  );

  const availableTimeBlocks = filterAvailableTimeBlocks(
    bookableTimeBlocks,
    appointments,
  );

  return availableTimeBlocks;
};

exports.generateTimeBlocksService = async (data) => {
  const { startTime, endTime, duration, replace = NONE } = data;

  const generatedTimeBlocks = generateTimeBlocks(startTime, endTime, duration);

  const newTimeBlocks = await prisma.$transaction(async (tx) => {
    if (replace === ALL) {
      await tx.timeBlock.deleteMany();
    } else if (replace === OVERLAP) {
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

  return newTimeBlocks.map(serializeTimeBlock);
};
