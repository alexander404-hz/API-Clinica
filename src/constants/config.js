exports.MS_PER_MINUTE = 1000 * 60; //ms * sec
exports.MS_PER_HOUR = exports.MS_PER_MINUTE * 60; //ms * min
exports.MS_PER_DAY = exports.MS_PER_HOUR * 24; //ms * hour

// Mantener sincronizado con CLINIC_TIME_ZONE (America/El_Salvador, sin horario de verano)
exports.CLINIC_UTC_OFFSET_MINUTES = -6 * 60;
exports.CLINIC_TIME_ZONE = "America/El_Salvador";

//for job close day
exports.RUN_AT_MINUTES = 5;

//for search field
exports.MAX_SEARCH_WORDS = 5;

//for paginate list results
exports.DEFAULT_PAGINATE_LIMIT = 30;
exports.MAX_PAGINATE_LIMIT = 100;
