const {
  createAppointmentService,
  getAppointmentService,
  listAppointmentsService,
  cancelAppointmentService,
  completeAppointmentService,
} = require("../services/appointmentService");

exports.createAppointment = async (req, res) => {
  const newAppointment = await createAppointmentService(
    req.validated.body,
    req.user,
    req.ip,
  );
  res.status(201).json(newAppointment);
};

exports.getAppointment = async (req, res) => {
  const appointment = await getAppointmentService(
    req.validated.params.id,
    req.user,
  );
  res.status(200).json(appointment);
};

exports.listAppointments = async (req, res) => {
  const appointments = await listAppointmentsService(
    req.validated.query,
    req.user,
  );
  res.status(200).json(appointments);
};

exports.cancelAppointment = async (req, res) => {
  const appointment = await cancelAppointmentService(
    req.validated.params.id,
    req.user,
    req.ip,
  );
  res.status(200).json(appointment);
};

exports.completeAppointment = async (req, res) => {
  const appointment = await completeAppointmentService(
    req.validated.params.id,
    req.user,
    req.ip,
  );
  res.status(200).json(appointment);
};
