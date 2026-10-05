const {
  listUsersService,
  getUserService,
  updateUserService,
  deleteUserService,
} = require("../services/userService");

exports.getMyProfile = async (req, res) => {
  const user = await getUserService(req.user.id);
  res.status(200).json(user);
};

exports.updateMyProfile = async (req, res) => {
  const updatedUser = await updateUserService(req.user.id, req.validated.body);
  res.status(200).json(updatedUser);
};

exports.listUsers = async (req, res) => {
  const users = await listUsersService(req.validated.query);
  res.status(200).json(users);
};

exports.getUser = async (req, res) => {
  const user = await getUserService(req.validated.params.id);
  res.status(200).json(user);
};

exports.updateUser = async (req, res) => {
  const updatedUser = await updateUserService(
    req.validated.params.id,
    req.validated.body,
  );
  res.status(200).json(updatedUser);
};

exports.deleteUser = async (req, res) => {
  await deleteUserService(req.validated.params.id, req.user.id);
  res.status(204).send();
};
