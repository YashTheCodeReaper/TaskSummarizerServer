const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const decodeUserId = require("../utils/decodeUserId");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const axios = require("axios");
const bcrypt = require("bcrypt");

exports.createTeam = catchAsync(async (req, res, next) => {
  try {
    let teamObj = {
      name: req.body.name,
      description: req.body.description,
      constraints: req.body.constraints,
      profilePicture: req.body.profilePicture,
    };

    let user_id = await decodeUserId(req);

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
    ${"`"}constraints${"`"},
    ${"`"}profile_picture_path${"`"},
    ${"`"}created_by${"`"})
    VALUES
    (UUID(),
    "${teamObj.name}",
    "${teamObj.description}",
    '${JSON.stringify(teamObj.constraints)}',
    "${profpicFileName ? `/images/team_profpics/${profpicFileName}` : ""}",
    '${user_id}');
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
      `Successfully got your teams`,
      "Internal server error!",
      "Error getting your teams!"
    );
  } catch (error) {
    console.error(error);
    return next(new AppError("500", "Internal server error"));
  }
});

exports.getTeam = catchAsync(async (req, res, next) => {
  try {
    let team_id = req.body.teamId;

    let queryString = `
    SELECT * FROM ${"`"}task_summarizer_db${"`"}.${"`"}teams${"`"}
    WHERE ${"`"}team_id${"`"} = '${team_id}';
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

exports.getAllInvolvedTeams = catchAsync(async (req, res, next) => {
  try {
    let allTeams = req.body.allTeams;

    let queryConditions = "";
    allTeams.forEach((teamId, index) => {
      queryConditions += `${"`"}team_id${"`"} = '${teamId}'${
        index + 1 == allTeams.length ? " ;" : " OR "
      }`;
    });

    let queryString = `
    SELECT * FROM ${"`"}task_summarizer_db${"`"}.${"`"}teams${"`"}${
      queryConditions ? " WHERE " + queryConditions : ";"
    }`;

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully fetched the specified teams`,
      "Internal server error!",
      "Error fetching the specified teams!"
    );
  } catch (error) {
    console.error(error);
    return next(new AppError("500", "Internal server error"));
  }
});

exports.createInvite = catchAsync(async (req, res, next) => {
  try {
    let inviteObj = {
      expireIn24Hours: req.body.expireIn24Hours,
      team_id: req.body.teamId,
      password: req.body.password,
    };

    let userId = await decodeUserId(req);
    let expiryStamp = "";
    let createdAt = new Date();
    createdAt = createdAt.getTime();

    if (inviteObj.expireIn24Hours) {
      let currentDate = new Date();
      currentDate.setHours(currentDate.getHours() + 24);
      expiryStamp = currentDate.getTime();
    }

    if (inviteObj.password)
      inviteObj.password = await encryptPassword(inviteObj.password, 10);

    let queryString = `
    INSERT INTO ${"`"}task_summarizer_db${"`"}.${"`"}invites${"`"}
    (${"`"}invite_id${"`"},
    ${"`"}expiry${"`"},
    ${"`"}team_id${"`"},
    ${"`"}password${"`"},
    ${"`"}created_by${"`"},
    ${"`"}created_at${"`"})
    VALUES
    ('${generateUID()}',
    '${expiryStamp}',
    '${inviteObj.team_id}',
    '${inviteObj.password}',
    '${userId}',
    '${createdAt}');
    `;

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully created an invite`,
      "Internal server error!",
      "Error creating an invite!"
    );
  } catch (error) {
    console.error(error);
    return next(new AppError("500", "Internal server error"));
  }
});

function generateUID() {
  var firstPart = (Math.random() * 46656) | 0;
  var secondPart = (Math.random() * 46656) | 0;
  firstPart = ("000" + firstPart.toString(36)).slice(-3);
  secondPart = ("000" + secondPart.toString(36)).slice(-3);
  return firstPart + secondPart;
}

async function encryptPassword(password, saltRounds) {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error;
  }
}

exports.getInvite = catchAsync(async (req, res, next) => {
  try {
    let teamId = req.body.teamId;
    let userId = await decodeUserId(req);
    let inviteId = req.body?.inviteId;

    let queryString = "";

    if (inviteId) {
      queryString = `
      SELECT * FROM ${"`"}task_summarizer_db${"`"}.${"`"}invites${"`"} 
      WHERE ${"`"}invite_id${"`"} = '${inviteId}';
      `;
    } else {
      queryString = `
      SELECT * FROM ${"`"}task_summarizer_db${"`"}.${"`"}invites${"`"} 
      WHERE ${"`"}created_by${"`"} = '${userId}' AND ${"`"}team_id${"`"} = '${teamId}';
      `;
    }

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully fetched all invites`,
      "Internal server error!",
      "Error fetching invites!"
    );
  } catch (error) {
    console.error(error);
    return next(new AppError("500", "Internal server error"));
  }
});

exports.deleteInvite = catchAsync(async (req, res, next) => {
  try {
    let inviteId = req.body.inviteId;
    let userId = await decodeUserId(req);

    let queryString = `
    DELETE FROM ${"`"}task_summarizer_db${"`"}.${"`"}invites${"`"}
    WHERE ${"`"}invite_id${"`"} = '${inviteId}' AND ${"`"}created_by${"`"} = '${userId}';
    `;

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully deleted an invite`,
      "Internal server error!",
      "Error deleting an invite!"
    );
  } catch (error) {
    console.error(error);
    return next(new AppError("500", "Internal server error"));
  }
});

exports.getTeamMembers = catchAsync(async (req, res, next) => {
  try {
    let teamId = req.body.teamId;

    let queryString = `
    SELECT * FROM ${"`"}task_summarizer_db${"`"}.${"`"}users${"`"}
    WHERE JSON_CONTAINS(${"`"}teams${"`"}, '["${teamId}"]');
    `;

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully got all members of the team`,
      "Internal server error!",
      "Error getting members of the team!"
    );
  } catch (error) {
    console.error(error);
    return next(new AppError("500", "Internal server error"));
  }
});

exports.getUnjoinedMembers = catchAsync(async (req, res, next) => {
  try {
    let teamId = req.body.teamId;
    let searchQuote = req.body.searchQuote;

    let queryString = `
    SELECT * FROM ${"`"}task_summarizer_db${"`"}.${"`"}users${"`"}
    WHERE !JSON_CONTAINS(${"`"}teams${"`"}, '["${teamId}"]') AND ${"`"}name${"`"} LIKE '%${searchQuote}%';
    `;

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully got all members of the who are not part of the team`,
      "Internal server error!",
      "Error getting members of the who are not part of the team!"
    );
  } catch (error) {
    console.error(error);
    return next(new AppError("500", "Internal server error"));
  }
});

exports.validateInvite = catchAsync(async (req, res, next) => {
  try {
    let password = req.body.password;
    let hashedPassword = req.body.hashedPassword;

    bcrypt.compare(password, hashedPassword, (err, result) => {
      if (err) {
        res.status(500).json({
          status: "failed",
          message: "Error occured while comparing passwords",
        });
        new AppError("403", "Error occured while comparing passwords!");
        return;
      }

      if (result) {
        res.status(200).json({
          status: "success",
          message: "Invitation is valid",
        });
      } else {
        res.status(400).json({
          status: "failed",
          message: "Invitation is invalid",
        });
        new AppError("403", "Invalid credentials!!");
      }
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("500", "Internal server error"));
  }
});
