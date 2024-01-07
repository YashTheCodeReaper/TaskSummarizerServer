const express = require("express");
const usersController = require("../controllers/usersController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router.patch("/joinTeam", usersController.joinTeam);

module.exports = router;
