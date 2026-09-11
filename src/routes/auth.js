const { Router } = require("express");
const router = Router();

const { register, login } = require("../controllers/authController");
const authenticateToken = require("../middlewares/auth");

router.post("/register", register);
router.post("/login", login);

router.get("/protected-route", authenticateToken, (req, res) => {
  res.send("Esta es una ruta protegida");
});

module.exports = router;
