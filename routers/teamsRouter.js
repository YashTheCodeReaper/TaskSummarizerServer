const express = require("express");
const teamsController = require("../controllers/teamsController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router.post("/createTeam", teamsController.createTeam);
router.post("/createInvite", teamsController.createInvite);
router.post("/getInvite", teamsController.getInvite);
router.delete("/deleteInvite", teamsController.deleteInvite);
router.post("/validateInvite", teamsController.validateInvite);
router.get("/getMyTeam", teamsController.getMyTeam);
router.post("/getTeam", teamsController.getTeam);
router.post("/getAllInvolvedTeams", teamsController.getAllInvolvedTeams);
router.post("/getTeamMembers", teamsController.getTeamMembers);
router.post("/getUnjoinedMembers", teamsController.getUnjoinedMembers);

module.exports = router;
