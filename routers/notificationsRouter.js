const express = require("express");
const notificationsController = require("../controllers/notificationsController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router.post("/createNotification", notificationsController.createNotification);
router.get(
  "/clearActiveNotificationStatus",
  notificationsController.clearActiveNotificationStatus
);
router.get("/getAllNotifications", notificationsController.getAllNotifications);
router.delete(
  "/deleteNotification",
  notificationsController.deleteNotification
);

module.exports = router;
