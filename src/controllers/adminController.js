const {
  createTimeBlockService,
  listAppointmentsService,
} = require("../services/adminService");

exports.createTimeBlock = async (req, res) => {
  try {
    const newTimeBlock = await createTimeBlockService(req.body);
    res.status(201).json(newTimeBlock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listAppointments = async (req, res) => {
  try {
    const appointments = await listAppointmentsService();
    res.status(201).json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
