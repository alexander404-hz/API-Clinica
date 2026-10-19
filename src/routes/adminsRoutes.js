const { Router } = require("express");
const router = Router();

const { Role } = require("../prisma");
const { ADMIN } = Role;

const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const { createAdminValidator } = require("../validators/adminValidator");
const { createAdmin } = require("../controllers/adminController");

router.use(authorize(ADMIN));

router.post("/", validate(createAdminValidator, "body"), createAdmin);

module.exports = router;
