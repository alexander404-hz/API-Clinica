const {
  createAdminService,
  deleteAdminService,
} = require("../services/adminService");

exports.createAdmin = async (req, res) => {
  const newUser = await createAdminService(
    req.validated.body,
    req.user.id,
    req.ip,
  );
  res.status(201).location(`/api/users/${newUser.id}`).json(newUser);
};

exports.deleteAdmin = async (req, res) => {
  await deleteAdminService(req.validated.params.id, req.user.id, req.ip);
  res.status(204).send();
};
