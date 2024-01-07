// Core application requirements
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
var session = require("express-session");

// Core security requirements
const rateLimit = require("express-rate-limit");
const xssClean = require("xss-clean");
const hpp = require("hpp");

// Core error handlers
const AppError = require("./utils/appError");
const GlobalErrorHandler = require("./controllers/errorController");

// Importing routers
const authRouter = require("./routers/authRouter");
const jiraRouter = require("./routers/jiraRouter");
const zohoRouter = require("./routers/zohoRouter");
const generalRouter = require("./routers/generalRouter");
const boardsRouter = require("./routers/boardsRouter");
const teamsRouter = require("./routers/teamsRouter");
const usersRouter = require("./routers/usersRouter");
const notificationsRouter = require("./routers/notificationsRouter");

// Init express
const app = express();

// Parse cookie middleware
app.use(cookieParser());
// app.use(session({
//   secret: 'The Oath-Breaker',
//   resave: true,
//   saveUninitialized: false,
//   cookie: {
//     path: '/',
//     domain: '/',
//     sameSite: 'none',
//     secure: true
//   }
// }));

// Set security headers to the client
app.use(function (req, res, next) {
  res.setHeader(
    "Content-Security-Policy",
    "default-src *'; font-src *; img-src *; script-src *; style-src *; frame-src *"
  );
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept"
  );
  next();
});

// Set public accessible directory
app.use(express.static("public"));

// Set CORS header
const corsOptions = {
  origin: true, //included origin as true
  credentials: false, //included credentials as true
};
app.use(cors(corsOptions));

// Limitting http requests
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from your IP. Please try again after an hour.",
});
app.use("/api", limiter);

// Developer log
app.use(morgan("dev"));

// Body parser for reading data from body to req.body
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(bodyParser.json());

// Data sanitization against XSS
app.use(xssClean());

// Parameter pollution preventer
app.use(
  hpp()
  // {
  //   whitelist: []
  // } //Include the query parameters to exclude parameter pollution prevention.
);

// Compress all json requests/response
app.use(compression());

// Register routers
app.use("/tetherfi/tsum/api/v1/auth", authRouter);
app.use("/tetherfi/tsum/api/v1/jira", jiraRouter);
app.use("/tetherfi/tsum/api/v1/zoho", zohoRouter);
app.use("/tetherfi/tsum/api/v1/general", generalRouter);
app.use("/tetherfi/tsum/api/v1/boards", boardsRouter);
app.use("/tetherfi/tsum/api/v1/teams", teamsRouter);
app.use("/tetherfi/tsum/api/v1/users", usersRouter);
app.use("/tetherfi/tsum/api/v1/notifications", notificationsRouter);

// Url validator
app.all("*", (req, res, next) => {
  next(new AppError("404", `Cannot find ${req.originalUrl}. Invalid URL!`));
});

app.use(GlobalErrorHandler);

// Export the app module
module.exports = app;
