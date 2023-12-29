const express = require("express");
const generalController = require("../controllers/generalController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router.patch("/updateOnboarding", generalController.updateOnboarding);

module.exports = router;
