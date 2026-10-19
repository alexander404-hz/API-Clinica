const {
  registerPatientService,
  loginUserService,
  changePasswordService,
} = require("../services/authService");

exports.registerPatient = (req, res) => {
  registerPatientService(req.validated.body).catch((err) =>
    console.error("Unhandled error in registration:", err),
  );

  res.status(202).json({
    message:
      "Thanks for registering! We've sent the next steps to your email. Please check your inbox.",
  });
};

exports.login = async (req, res) => {
  const token = await loginUserService(
    req.account,
    req.validated.body.password,
  );

  return res.json({
    token,
    user: {
      id: req.account.id,
      username: req.account.username,
      role: req.account.role,
      mustChangePassword: req.account.mustChangePassword,
    },
  });
};

exports.changePassword = async (req, res) => {
  const token = await changePasswordService(req.user.id, req.validated.body);
  res.json({ token });
};
