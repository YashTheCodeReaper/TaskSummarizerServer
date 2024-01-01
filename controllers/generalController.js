const catchAsync = require("../utils/catchAsync");
const decodeUserId = require("../utils/decodeUserId");
const AppError = require("../utils/appError");

exports.updateOnboarding = catchAsync(async (req, res, next) => {
  try {
    let obObj = req.body.obObj;
    const userId = await decodeUserId(req);

    let queryString = `
    UPDATE ${"`"}task_summarizer_db${"`"}.${"`"}users${"`"}
    SET ${"`"}onboarding${"`"} = '${JSON.stringify(obObj)}'
    WHERE ${"`"}user_id${"`"} = '${userId}';
    `;

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully updated onboarding status`,
      "Internal server error!",
      "Error updating onboarding status!"
    );
  } catch (error) {
    console.log(error);
    return next(new AppError("500", "Internal server error"));
  }
});
