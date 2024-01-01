const express = require("express");
const teamsController = require("../controllers/teamsController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router.post("/createTeam", teamsController.createTeam);
router.get("/getMyTeam", teamsController.getMyTeam);
router.post("/getAllInvolvedTeams", teamsController.getAllInvolvedTeams);

module.exports = router;
