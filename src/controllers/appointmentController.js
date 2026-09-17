const {
  createAppointmentService,
  getAppointmentService,
  updateAppointmentService,
  deleteAppointmentService,
} = require("../services/appointmentsService");

exports.createAppointment = async (req, res) => {
  try {
    const newAppointment = await createAppointmentService(req.body);
    res.status(201).json(newAppointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAppointment = async (req, res) => {
  try {
    const appointment = await getAppointmentService(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const updatedAppointment = await updateAppointmentService(
      req.params.id,
      req.body,
    );

    if (!updatedAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.status(201).json(updatedAppointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const deletedAppointment = await deleteAppointmentService(req.params.id);

    if (!deleteAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};