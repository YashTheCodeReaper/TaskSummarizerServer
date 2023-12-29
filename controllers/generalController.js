const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

exports.updateOnboarding = catchAsync(async (req, res, next) => {
  try {
    let obObj = req.body.obObj;
    const decodedToken = await promisify(jwt.verify)(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    );

    let queryString = `
    UPDATE ${"`"}task_summarizer_db${"`"}.${"`"}users${"`"}
    SET ${"`"}onboarding${"`"} = '${JSON.stringify(obObj)}'
    WHERE ${"`"}user_id${"`"} = '${decodedToken.id}';
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
    console.log(error)
    return next(new AppError("500", "Internal server error"));
  }
});
