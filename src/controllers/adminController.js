const { createAdminService } = require("../services/adminService");

exports.createAdmin = async (req, res) => {
  const newUser = await createAdminService(req.validated.body);
  res.status(201).location(`/api/users/${newUser.id}`).json(newUser);
};
