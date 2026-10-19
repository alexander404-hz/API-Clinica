const AppError = require("../utils/AppError");

const { Role } = require("../prisma");
const { PATIENT } = Role;

const { CONFLICT, VALIDATION_ERROR } = require("../constants/errorCodes");
const { MS_PER_MINUTE, MS_PER_DAY } = require("../constants/config");

const {
  PATIENT_MIN_NOTICE_MINUTES,
  STAFF_MIN_NOTICE_MINUTES,
  MAX_BOOKING_ADVANCE_DAYS,
} = require("../constants/timeblock");

const formatTime = (date) => date.toISOString().slice(11, 16);

/**
 * Convierte un campo @db.Time (que Prisma devuelve como 1970-01-01T08:00:00Z)
 * en un Date real dentro del día de la clínica que empieza en dayStart.
 */
const timeOfDayToDate = (time, dayStart) =>
  new Date(
    dayStart.getTime() +
      (time.getUTCHours() * 60 + time.getUTCMinutes()) * MS_PER_MINUTE,
  );

exports.serializeTimeBlock = (timeBlock) => {
  const { startTime, endTime, ...rest } = timeBlock;

  const start = formatTime(startTime);
  const end = formatTime(endTime);

  return { ...rest, startTime: start, endTime: end };
};

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

exports.generateTimeBlocks = (start, end, duration) => {
  const generatedTimeBlocks = [];

  let startTime = start;

  const sumDateTime = (a, b) => new Date(a.getTime() + b.getTime());

  while (sumDateTime(startTime, duration) <= end) {
    const timeBlock = {};

    timeBlock.startTime = startTime;
    timeBlock.endTime = sumDateTime(startTime, duration);

    generatedTimeBlocks.push(timeBlock);

    startTime = timeBlock.endTime;
  }

  return generatedTimeBlocks;
};

exports.getBookingWindow = (currentUser, now = new Date()) => {
  const noticeMinutes =
    currentUser.role === PATIENT
      ? PATIENT_MIN_NOTICE_MINUTES
      : STAFF_MIN_NOTICE_MINUTES;

  return {
    now,
    earliest: new Date(now.getTime() + noticeMinutes * MS_PER_MINUTE),
    latest: new Date(now.getTime() + MAX_BOOKING_ADVANCE_DAYS * MS_PER_DAY),
  };
};

exports.assertDayWithinBookingWindow = (dayStart, dayEnd, { now, latest }) => {
  if (dayEnd <= now) {
    throw new AppError(
      "Appointments cannot be booked for a day that has already passed.",
      400,
      VALIDATION_ERROR,
    );
  }

  if (dayStart > latest) {
    throw new AppError(
      `Appointments can only be booked up to ${MAX_BOOKING_ADVANCE_DAYS} days in advance.`,
      400,
      VALIDATION_ERROR,
    );
  }
};

exports.toDayTimeBlocks = (timeBlocks, dayStart) =>
  timeBlocks.map((timeBlock) => ({
    id: timeBlock.id,
    startsAt: timeOfDayToDate(timeBlock.startTime, dayStart),
    endsAt: timeOfDayToDate(timeBlock.endTime, dayStart),
  }));

exports.filterBookableTimeBlocks = (timeBlocks, { earliest, latest }) =>
  timeBlocks.filter(
    (block) => block.startsAt >= earliest && block.startsAt <= latest,
  );

exports.rangesOverlap = (startA, endA, startB, endB) =>
  startA < endB && endA > startB;

exports.filterAvailableTimeBlocks = (timeBlocks, appointments) =>
  timeBlocks.filter(
    (block) =>
      !appointments.some(
        (appointment) =>
          block.startsAt < appointment.endsAt &&
          block.endsAt > appointment.startsAt,
      ),
  );
