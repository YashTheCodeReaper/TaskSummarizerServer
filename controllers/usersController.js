const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const decodeUserId = require("../utils/decodeUserId");

exports.joinTeam = catchAsync(async (req, res, next) => {
  try {
    let team_id = req.body.teamId;
    let user_id = await decodeUserId(req);

    let queryString = `
    UPDATE ${"`"}task_summarizer_db${"`"}.${"`"}users${"`"}
    SET ${"`"}teams${"`"} = JSON_ARRAY_APPEND(${"`"}teams${"`"}, '$', '${team_id}')
    WHERE ${"`"}user_id${"`"} = '${user_id}';
    `;

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully updated my teams!`,
      "Internal server error!",
      "Error updating my teams!"
    );
  } catch (error) {
    console.error(error);
    return next(new AppError("500", "Internal server error"));
  }
});

exports.getMyTeam = catchAsync(async (req, res, next) => {
  try {
    let user_id = await decodeUserId(req);

    let queryString = `
    SELECT * FROM ${"`"}task_summarizer_db${"`"}.${"`"}teams${"`"}
    WHERE ${"`"}created_by${"`"} = '${user_id}';
    `;

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully got a team`,
      "Internal server error!",
      "Error getting a team!"
    );
  } catch (error) {
    console.error(error);
    return next(new AppError("500", "Internal server error"));
  }
});
