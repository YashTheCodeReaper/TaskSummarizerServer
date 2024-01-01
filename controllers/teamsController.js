const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const decodeUserId = require("../utils/decodeUserId");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const axios = require("axios");

exports.createTeam = catchAsync(async (req, res, next) => {
  try {
    let teamObj = {
      name: req.body.name,
      description: req.body.description,
      constraints: req.body.constraints,
      profilePicture: req.body.profilePicture,
    };

    teamObj.users = [await decodeUserId(req)];

    let profpicFileName = "";
    if (teamObj.profilePicture) {
      const unix = new Date().getTime();
      profpicFileName =
        (unix + "_" + teamObj.name).replaceAll(" ", "") + ".png";
      saveBase64Image(
        teamObj.profilePicture,
        path.join("public/images/team_profpics/", profpicFileName)
      );
    }

    let queryString = `
    INSERT INTO ${"`"}task_summarizer_db${"`"}.${"`"}teams${"`"}
    (${"`"}team_id${"`"},
    ${"`"}name${"`"},
    ${"`"}description${"`"},
    ${"`"}users${"`"},
    ${"`"}constraints${"`"},
    ${"`"}profile_picture_path${"`"},
    ${"`"}created_by${"`"})
    VALUES
    (UUID(),
    "${teamObj.name}",
    "${teamObj.description}",
    '${JSON.stringify(teamObj.users)}',
    '${JSON.stringify(teamObj.constraints)}',
    "${profpicFileName ? `/images/team_profpics/${profpicFileName}` : ""}",
    '${teamObj.users[0]}');
    `;

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully created a team`,
      "Internal server error!",
      "Error creating a team!"
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

exports.getTeam = catchAsync(async (req, res, next) => {
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
