exports.toPatientResponse = (patient) => {
  const { user, ...profile } = patient;
  const patientResponse = { ...user, ...profile };
  
  return patientResponse;
};
