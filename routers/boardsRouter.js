const express = require("express");
const boardsController = require("../controllers/boardsController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router.post("/createBoard", boardsController.createBoard);
router.get("/getAllBoards", boardsController.getAllBoards);
router.patch("/updateLinkedTeams", boardsController.updateLinkedTeams);

module.exports = router;
