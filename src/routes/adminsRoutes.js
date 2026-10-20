const { Router } = require("express");
const router = Router();

const { Role } = require("../prisma");
const { ADMIN } = Role;

const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const { createAdminValidator } = require("../validators/adminValidator");
const { createAdmin, deleteAdmin } = require("../controllers/adminController");
const { idParamValidator } = require("../validators/validatorUtils");

router.use(authorize(ADMIN));

router.post("/", validate(createAdminValidator, "body"), createAdmin);

router.delete("/:id", validate(idParamValidator, "params"), deleteAdmin);

module.exports = router;
