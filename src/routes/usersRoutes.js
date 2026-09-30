const { Router } = require("express");
const { authorize } = require("../middlewares/authorize");

const {
  ROLES: { ADMIN },
} = require("../constants/roles");

const {
  getMyProfile,
  updateMyProfile,
  listUsers,
  getAUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const router = Router();
/* 
router.get("/me", getMyProfile);
router.patch("/me", updateMyProfile); */

router.get("/", authorize("ADMIN"), listUsers);
/* router.get("/:id", authorize("ADMIN"), getAUser);
router.patch("/:id", authorize("ADMIN"), updateUser);
router.delete("/:id", authorize("ADMIN"), deleteUser); */

module.exports = router;
