const {
  closeExpiredAppointmentsService,
} = require("../services/appointmentService");

(async () => {
  // Simula que "ahora" es mañana a las 00:10 hora de la clínica (06:10 UTC)
  const fakeNow = new Date("2026-10-19T06:10:00Z");
  const count = await closeExpiredAppointmentsService(fakeNow);
  console.log(`${count} cita(s) marcadas como NO_SHOW`);
  process.exit(0);
})();

//node src/scripts/testClose.js