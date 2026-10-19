const {
  closeExpiredAppointmentsService,
} = require("../services/appointmentService");
const { MS_PER_MINUTE, RUN_AT_MINUTES } = require("../constants/config");

const {
  getClinicDayRange,
  getClinicDateOf,
} = require("../helpers/commonHelpers");

// Próxima ejecución: 00:05 de mañana (hora de la clínica) como instante real
const getNextRun = (now = new Date()) => {
  const { dayEnd } = getClinicDayRange(getClinicDateOf(now)); // 00:00 de mañana
  return new Date(dayEnd.getTime() + RUN_AT_MINUTES * MS_PER_MINUTE);
};

const run = async () => {
  try {
    const count = await closeExpiredAppointmentsService();
    console.log(`[closeDay] ${count} appointment(s) marked as NO_SHOW`);
  } catch (error) {
    console.error("[closeDay] failed:", error);
  }
};

const scheduleNext = () => {
  const delay = getNextRun().getTime() - Date.now();

  const timer = setTimeout(async () => {
    await run();
    scheduleNext(); // se programa de nuevo para el día siguiente
  }, delay);

  timer.unref(); // no impide que el proceso termine al apagar el servidor
};

exports.startCloseDayJob = () => {
  run(); // recuperación: si estuvo apagado a las 00:05, se ejecuta al arrancar
  scheduleNext();
};
