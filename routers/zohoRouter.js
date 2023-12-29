const express = require("express");
const zohoController = require("../controllers/zohoController");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/getAccessToken", zohoController.accessToken);
router.get("/oAuthReq", zohoController.oAuthReq);

module.exports = router;