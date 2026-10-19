exports.REPLACE_FILTER = Object.freeze({
  NONE: "NONE",
  OVERLAP: "OVERLAP",
  ALL: "ALL",
});

exports.VALID_REPLACE = Object.values(exports.REPLACE_FILTER);

exports.PATIENT_MIN_NOTICE_MINUTES = 120;
exports.STAFF_MIN_NOTICE_MINUTES = 0;
exports.MAX_BOOKING_ADVANCE_DAYS = 60;
