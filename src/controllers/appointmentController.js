const {
  createAppointmentService,
  listAppointmentsService,
  getAppointmentService,
  updateAppointmentService,
  deleteAppointmentService,
} = require("../services/appointmentService");

exports.createAppointment = async (req, res) => {
  const newAppointment = await createAppointmentService(req.body, req.user);
  res.status(201).json(newAppointment);
};

exports.listAppointments = async (req, res) => {
  const appointments = await listAppointmentsService(req.user, req.query);
  res.status(200).json(appointments);
};

exports.getAppointment = async (req, res) => {
  const appointment = await getAppointmentService(req.params.id, req.user);
  res.status(200).json(appointment);
};

exports.updateAppointment = async (req, res) => {
  const updatedAppointment = await updateAppointmentService(
    req.params.id,
    req.body,
    req.user,
  );

  res.status(200).json(updatedAppointment);
};

exports.deleteAppointment = async (req, res) => {
  const deletedAppointment = await deleteAppointmentService(
    req.params.id,
    req.user,
  );

  res.status(200).json({ message: "Cita eliminada", data: deletedAppointment });
};
