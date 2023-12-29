const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/registerUser", authController.registerUser);
router.post("/logInUser", authController.logInUser);
router.post("/authorizeUser", authController.authorizeUser);

module.exports = router;