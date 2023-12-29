// declaring libs
const AppError = require("../utils/appError");

const handleJwtError = () => {
  return new AppError("401", "Invalid login token!");
};

const handleJwtExpiryError = () => {
  return new AppError("401", "Login token expired! Please login again");
};

// error to be sent for development purposes
const devError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

// error to be sent for productin purposes (user-friendly)
const prodError = (err, res) => {
  if (err.isOperationalErr) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
    });
  } else {
    // console.error("Error!", err);
    res.status(500).json({
      status: "error",
      message: "Something not right!",
    });
  }
};

// exporting error response
module.exports = (err, req, res, next) => {
  console.log(err);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    if (err.name === "JsonWebTokenError") error = handleJwtError();
    else if (err.name === "TokenExpiredError") error = handleJwtExpiryError();
    else error = err;
    prodError(error, res);
  } else if (process.env.NODE_ENV === "development") {
    devError(err, res);
  }
};
