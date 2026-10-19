const {
  createPatientService,
  listPatientsService,
  getPatientService,
  updatePatientService,
  deletePatientService,
} = require("../services/patientService");

exports.getMyProfile = async (req, res) => {
  const patient = await getPatientService(req.user.id);
  res.status(200).json(patient);
};

exports.updateMyProfile = async (req, res) => {
  const updatedPatient = await updatePatientService(
    req.user.id,
    req.validated.body,
  );
  res.status(200).json(updatedPatient);
};

exports.createPatient = async (req, res) => {
  const newPatient = await createPatientService(req.validated.body);
  res.status(201).json(newPatient);
};

exports.getPatient = async (req, res) => {
  const patient = await getPatientService(req.validated.params.id);
  res.status(200).json(patient);
};

exports.listPatients = async (req, res) => {
  const patients = await listPatientsService(req.validated.query);
  res.status(200).json(patients);
};

exports.updatePatient = async (req, res) => {
  const updatedPatient = await updatePatientService(
    req.validated.params.id,
    req.validated.body,
  );
  res.status(200).json(updatedPatient);
};

exports.deletePatient = async (req, res) => {
  await deletePatientService(req.validated.params.id, req.user.id);
  res.status(204).send();
};
