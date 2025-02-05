const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/users", userController.getUsers);
router.post("/users/register", userController.registerUser);
router.post("/users/login", userController.loginUser);
router.post("/users/admin", userController.createAdmin);
router.get("/users/admins", userController.getAdmins); // Paginated admins
router.get("/users/all-admins", userController.getAllAdmins); // All admins without pagination
router.get("/users/:userId", userController.getUserById);
router.put("/users/:userId", userController.updateUser);
router.delete("/users/:userId", userController.deleteUser);

module.exports = router;