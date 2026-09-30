const {
  createUserService,
  listUsersService,
  getUserService,
  updateUserService,
  deleteUserService,
} = require("../services/userService");

/* exports.getMyProfile = async (req, res) => {
  const user = await getUserService(req.user.id);
  res.status(200).json(user);
};

exports.updateMyProfile = async (req, res) => {
  const updatedUser = await updateUserService(
    req.user.id,
    req.body,
    req.user.role,
  );
  res.status(200).json(updatedUser);
};
 */
/* exports.createUser = async (req, res) => {
  const newUser = await createUserService(req.body);
  res.status(201).json(newUser);
};
 */
exports.listUsers = async (req, res) => {
  const users = await listUsersService(req.query);
  res.status(200).json(users);
};

/* exports.getUser = async (req, res) => {
  const user = await getUserService(req.params.id);
  res.status(200).json(user);
};

exports.updateUser = async (req, res) => {
  const updatedUser = await updateUserService(req.params.id, req.body);
  res.status(200).json(updatedUser);
};

exports.deleteUser = async (req, res) => {
  const deletedUser = await deleteUserService(req.params.id);
  res.status(200).json({ message: "Usuario eliminado", data: deletedUser });
}; */

