const {
  createTimeBlockService,
  listAppointmentsService,
} = require("../services/adminService");

exports.createTimeBlock = async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Access denied" });
  }

  const { startTime, endTime } = req.body;

  try {
    const newTimeBlock = await createTimeBlockService(startTime, endTime);
    res.status(201).json(newTimeBlock);
  } catch (error) {
    res.status(500).json({ error: "Error creating time block" });
  }
};

exports.listAppointments = async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const appointments = await listAppointmentsService();
    res.status(201).json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Error fetching appointments" });
  }
};

module.exports = { createTimeBlock, listAppointments };
