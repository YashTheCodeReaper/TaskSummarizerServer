const express = require("express");
const jiraController = require("../controllers/jiraController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect)

// router.post("/listenHook", jiraController.listenHook);
router.post("/fetchJiraHistory", jiraController.fetchJiraHistory);

module.exports = router;
