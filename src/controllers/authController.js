const { registerUser, loginUser } = require("../services/authService");

exports.register = async (req, res) => {
  try {
    await registerUser(req.body);
    return res.status(201).json({ message: "User registered Successfully" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await loginUser(email, password);
    return res.json({ token });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
