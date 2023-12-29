const dotenv = require("dotenv");
const app = require("./app.js");
const fs = require("fs");
const mysql2 = require("mysql2");
var https = require("https");
var privateKey = fs.readFileSync("./key.pem", "utf8");
var certificate = fs.readFileSync("./certificate.pem", "utf8");
var secureHttpCredentials = { key: privateKey, cert: certificate };
const AppError = require("./utils/appError.js");

// configuring dotenv package
dotenv.config({
  path: "./.env",
});

// Database connection params
const dbConnection = mysql2.createConnection({
  host: "127.0.0.1",
  user: "root",
  database: "task_summarizer_db",
  password: "Ya01022000#",
  port: 3306,
});

// Database connection establishment
dbConnection.connect((error) => {
  if (error) console.log(error);
  console.log("database connection established...");
});

function dbResultHandler(
  queryString,
  response,
  successMessage,
  serverFailureMessage,
  dbFailureMessage
) {
  dbConnection.query(queryString, (error, result) => {
    console.log(error);
    if (error) {
      response.status(400).json({
        status: "failed",
        message: dbFailureMessage,
      });
      new AppError("403", dbFailureMessage);
    }
    if (result) {
      response.status(200).json({
        status: "success",
        message: successMessage,
        data: result,
      });
    } else {
      new AppError("403", serverFailureMessage);
    }
  });
}

// declaring port
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// // server connection establishment
// const server = httpsServer.listen(port, () => {
//   console.log(`Server Connection Established! at PORT: ${port}`);
// });

// uncaught exception handling
process.on("uncaughtException", (err) => {
  console.error(err.name, err.message);
  console.log("Uncaught exception error!");
  server.close(() => {
    process.exit(1);
  });
});

// unhandled rejection error handling
process.on("unhandledRejection", (err) => {
  console.error(err.name, err.message);
  console.log("Unhandled rejection error!");
  server.close(() => {
    process.exit(1);
  });
});

module.exports = {
  databaseHandler: dbResultHandler,
  dbConnection: dbConnection,
};
