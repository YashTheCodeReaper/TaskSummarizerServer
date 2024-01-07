const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const decodeUserId = require("../utils/decodeUserId");

exports.createNotification = catchAsync(async (req, res, next) => {
  try {
    let notificationObj = {
      userId: req.body.userId,
      type: req.body.type,
      data: req.body.data,
    };
    let createdAt = new Date();
    createdAt = createdAt.getTime();

    let queryString = `
    INSERT INTO ${"`"}task_summarizer_db${"`"}.${"`"}notifications${"`"}
    (${"`"}notification_id${"`"},
    ${"`"}user${"`"},
    ${"`"}created_at${"`"},
    ${"`"}type${"`"},
    ${"`"}data${"`"})
    VALUES
    (UUID(),
    '${notificationObj.userId}',
    '${createdAt}',
    '${notificationObj.type}',
    '${JSON.stringify(notificationObj.data)}');
    `;

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully created a new notification`,
      "Internal server error!",
      "Error creating a notification!"
    );
  } catch (error) {
    console.error(error);
    return next(new AppError("500", "Internal server error"));
  }
});

exports.getAllNotifications = catchAsync(async (req, res, next) => {
  try {
    let userId = await decodeUserId(req);

    let queryString = `
    SELECT * FROM ${"`"}task_summarizer_db${"`"}.${"`"}notifications${"`"}
    WHERE ${"`"}user${"`"} = '${userId}';    
    `;

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully got all notifications for the user`,
      "Internal server error!",
      "Error getting all notifications for the user!"
    );
  } catch (error) {
    console.error(error);
    return next(new AppError("500", "Internal server error"));
  }
});

exports.clearActiveNotificationStatus = catchAsync(async (req, res, next) => {
  try {
    let userId = await decodeUserId(req);

    let queryString = `
    UPDATE ${"`"}task_summarizer_db${"`"}.${"`"}notifications${"`"}
    SET ${"`"}is_active${"`"} = '0'
    WHERE ${"`"}user${"`"} = '${userId}' AND ${"`"}is_active${"`"} = '1';        
    `;

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully made all notification status as inactive`,
      "Internal server error!",
      "Error setting inactive notification statuses!"
    );
  } catch (error) {
    console.error(error);
    return next(new AppError("500", "Internal server error"));
  }
});

exports.deleteNotification = catchAsync(async (req, res, next) => {
  try {
    let not_id = req.body.notificationId;

    let queryString = `
    DELETE FROM ${"`"}task_summarizer_db${"`"}.${"`"}notifications${"`"}
    WHERE ${"`"}notification_id${"`"} = '${not_id}';          
    `;

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully deleted notification`,
      "Internal server error!",
      "Error deleting notification!"
    );
  } catch (error) {
    console.error(error);
    return next(new AppError("500", "Internal server error"));
  }
});
