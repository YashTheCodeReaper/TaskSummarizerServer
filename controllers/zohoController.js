const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const axios = require("axios");

exports.oAuthReq = catchAsync(async (req, res, next) => {
  try {
    const authObj = {
      client_id: process.env.ZOHO_CLIENT_ID,
      redirect_url: process.env.ZOHO_REDL1,
      scopes: process.env.ZOHO_SCOPES,
    };

    res.send({
      status: "success",
      message: 'Successfully got oauth req url',
      data: `https://accounts.zoho.com/oauth/v2/auth?scope=${authObj.scopes}&client_id=${authObj.client_id}&response_type=code&access_type=online&redirect_uri=${authObj.redirect_url}&prompt=consent`,
    });
  } catch (error) {
    return next(new AppError("500", "Internal server error"));
  }
});

exports.accessToken = catchAsync(async (req, res, next) => {
  try {
    const authCode = req.body.code;

    const response = await axios.post(
      "https://accounts.zoho.in/oauth/v2/token",
      null,
      {
        params: {
          grant_type: process.env.ZOHO_GRANT_TYPE,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          redirect_uri: process.env.ZOHO_REDL1,
          code: authCode,
        },
      }
    );
    console.log("Returned Data : ", response.data);
    res.send({
      status: "success",
      message: 'Successfully got access token',
      data: response.data
    });
  } catch (error) {
    console.log(error);
    return next(new AppError("500", "Internal server error"));
  }
});
