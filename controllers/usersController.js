const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const decodeUserId = require("../utils/decodeUserId");

exports.updateMyTeams = catchAsync(async (req, res, next) => {
  try {
    let modifiedTeams = req.body.modifiedTeams;
    let user_id = await decodeUserId(req);

    let queryString = `
    UPDATE ${"`"}task_summarizer_db${"`"}.${"`"}users${"`"}
    SET ${"`"}teams${"`"} = '${JSON.stringify(modifiedTeams)}'
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

async function saveBase64Image(base64Url, outputFilePath) {
  try {
    const response = await axios.get(base64Url, {
      responseType: "arraybuffer",
    });
    const imageBuffer = Buffer.from(response.data, "binary");
    const resizedBuffer = await sharp(imageBuffer)
      .resize({ width: 100, height: 100 })
      .toBuffer();
    fs.writeFileSync(outputFilePath, resizedBuffer);
  } catch (error) {
    console.error("Error saving image:", error.message);
  }
}

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
