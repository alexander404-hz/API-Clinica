const {
  createPatientService,
  listPatientsService,
} = require("../services/patientService");

/* exports.getMyProfile = async (req, res) => {
  const user = await getUserService(req.user.id);
  res.status(200).json(user);
};

exports.updateMyProfile = async (req, res) => {
  const updatedUser = await updateUserService(req.user.id, req.validated.body);
  res.status(200).json(updatedUser);
}; */

exports.createPatient = async (req, res) => {
  const newUser = await createPatientService(req.validated.body);
  res.status(201).json(newUser);
};

exports.listPatients = async (req, res) => {
  const users = await listPatientsService(req.validated.query);
  res.status(200).json(users);
};

/*
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
}; */
