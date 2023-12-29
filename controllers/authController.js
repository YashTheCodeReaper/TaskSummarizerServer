const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const AppError = require("../utils/appError");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const axios = require("axios");
const sharp = require("sharp");

/**
 * Endpoint to register a new user
 */
exports.registerUser = catchAsync(async (req, res, next) => {
  try {
    let userCreds = {
      email: req.body.email,
      name: req.body.name,
      password: req.body.password,
      jira: req.body.jira,
      designation: req.body.designation,
      profilePicture: req.body.profilePicture,
      onboarding: {
        dashboard: false,
        timesheetCompanion: false,
        teams: false,
        settings: false,
        intro: false
      },
    };

    let profpicFileName = "";
    if (userCreds.profilePicture) {
      profpicFileName =
        (userCreds.email + "_" + userCreds.name)
          .replaceAll("@", "")
          .replaceAll(" ", "") + ".png";
      saveBase64Image(
        userCreds.profilePicture,
        path.join("public/images/profpics/", profpicFileName)
      );
    }

    encryptPassword(userCreds.password, 10)
      .then((hashedPassword) => {
        let queryString = `
        INSERT INTO ${"`"}task_summarizer_db${"`"}.${"`"}users${"`"}
        (
        ${"`"}user_id${"`"},
        ${"`"}email${"`"},
        ${"`"}name${"`"},
        ${"`"}password${"`"},
        ${"`"}jira${"`"},
        ${"`"}profile_picture_path${"`"},
        ${"`"}designation${"`"},
        ${"`"}onboarding${"`"}
        )
        VALUES
        (
        UUID(),
        '${userCreds.email}',
        '${userCreds.name}',
        '${hashedPassword}',
        ${JSON.stringify(userCreds.jira)},
        '/images/profpics/${profpicFileName}',
        '${userCreds.designation}',
        '${JSON.stringify(userCreds.onboarding)}'
        );
        `;

        const serverFunctions = require("../server");
        serverFunctions.databaseHandler(
          queryString,
          res,
          `Successfully registered user`,
          "Internal server error!",
          "Error registering user!"
        );
      })
      .catch((error) => {
        console.log(error);
        return next(new AppError("403", "Failed to create encrypted password"));
      });
  } catch (error) {
    console.log(error);
    return next(new AppError("500", "Internal server error"));
  }
});

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

/**
 * Endpoint to login a user
 */

exports.logInUser = catchAsync(async (req, res, next) => {
  try {
    let credentials = {
      email: req.body.email,
      password: req.body.password,
      staySigned: req.body.staySigned,
    };

    if (!credentials || !credentials.email || !credentials.password) {
      return next(new AppError("403", "Invalid / Missing credentials"));
    }

    let queryString = `
    SELECT ${"`"}users${"`"}.${"`"}email${"`"}, ${"`"}users${"`"}.${"`"}password${"`"} FROM ${"`"}task_summarizer_db${"`"}.${"`"}users${"`"} 
    WHERE ${"`"}users${"`"}.${"`"}email${"`"} = '${credentials.email}';
    `;

    const serverFunctions = require("../server");
    serverFunctions.dbConnection.query(queryString, (error, result) => {
      console.log(error);
      if (error) {
        response.status(200).json({
          status: "failed",
          message: "Error finding user",
        });
        new AppError("403", "Error finding user!");
      }

      if (result && result.length) {
        bcrypt.compare(
          credentials.password,
          result[0].password,
          (err, result) => {
            if (err) {
              response.status(400).json({
                status: "failed",
                message: "Error occured while comparing passwords",
              });
              new AppError("403", "Error occured while comparing passwords!");
              return;
            }

            if (result) {
              createSendToken(credentials.email, res, credentials.staySigned);
            } else {
              res.status(200).json({
                status: "failed",
                message: "Invalid credentials!",
              });
              new AppError("403", "Invalid credentials!!");
            }
          }
        );
      } else {
        res.status(200).json({
          status: "failed",
          message: "User not found!",
        });
        new AppError("403", "User not found!");
      }
    });
  } catch (error) {
    return next(new AppError("500", "Internal server error"));
  }
});

function createSendToken(email, res, staySigned) {
  const token = signToken(email, staySigned);
  res.status(200).json({
    status: "success",
    message: "Successfully logged in the user",
    token: token,
  });
}

function signToken(id, staySigned) {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: !staySigned ? process.env.JWT_EXPIRY : "30d",
  });
}

/**
 * Endpoint to validate user existance / route protection
 */
exports.authorizeUser = catchAsync(async (req, res, next) => {
  try {
    let token = req.body.token;
    if (!token) {
      return new AppError("403", "Token not found!");
    }

    const decodedToken = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET
    );

    let queryString = `
    SELECT * FROM ${"`"}task_summarizer_db${"`"}.${"`"}users${"`"} 
    WHERE ${"`"}users${"`"}.${"`"}email${"`"} = '${decodedToken.id}';
    `;

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully retrieved user data`,
      "Internal server error!",
      "Error finding user data!"
    );
  } catch (error) {
    return next(new AppError("500", "Internal server error"));
  }
});

/**
 * Endpoint to protect the routes
 */
exports.protect = catchAsync(async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    if (!token) return next(new AppError("401", "Unauthorized access!"));

    const decodedToken = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET
    );

    let queryString = `
    SELECT ${"`"}users${"`"}.${"`"}email${"`"} FROM ${"`"}task_summarizer_db${"`"}.${"`"}users${"`"} 
    WHERE ${"`"}users${"`"}.${"`"}email${"`"} = '${decodedToken.id}';
    `;

    const serverFunctions = require("../server");
    serverFunctions.dbConnection.query(queryString, (error, result) => {
      console.log(error);
      if (error) {
        response.status(200).json({
          status: "failed",
          message: "Error while checking authorization",
        });
        return new AppError("403", "Error while checking authorization!");
      }

      if (result && result.length) {
        next();
      } else {
        res.status(200).json({
          status: "failed",
          message: "Unauthorized user access!",
        });
        return new AppError("403", "Unauthorized user access!");
      }
    });
  } catch (error) {
    return next(new AppError("500", "Internal server error"));
  }
});
