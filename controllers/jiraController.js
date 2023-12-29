const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const axios = require("axios");
const fs = require("fs/promises");
var baseUrl = "https://tetherfi-pte-ltd.atlassian.net/rest/api/2";

const WebSocket = require("ws");
const wss = new WebSocket.Server({
  port: 7071,
});

exports.listenHook = catchAsync(async (req, res, next) => {
  try {
    console.log(JSON.stringify(req.body));
  } catch (error) {
    return next(new AppError("500", "Internal server error"));
  }
});

exports.fetchJiraHistory = catchAsync(async (req, res, next) => {
  try {
    wss.on("connection", async function (ws) {
      console.log("Socket connection opened");

      ws.onclose = () => {
        console.log("Socket connection closed");
      };

      let jiraCreds = {
        email: req.body.email,
        apiToken: req.body.apiToken,
      };
      let allIssues = [];
      let startAt = 0;
      const pageSize = 100;
      let response;

      do {
        response = await axios.get(`${baseUrl}/search`, {
          params: {
            jql: `(assignee = currentUser() OR assignee was currentUser())`,
            startAt,
            maxResults: pageSize,
          },
          auth: {
            username: jiraCreds.email,
            password: jiraCreds.apiToken,
          },
        });

        allIssues = allIssues.concat(
          response.data.issues.map((issue) => issue.key)
        );

        ws.send(
          JSON.stringify({
            totalIssues: response.data.total,
            foundIssues: allIssues.length,
            userEmail: jiraCreds.email,
          })
        );

        startAt += pageSize;
        console.log(startAt, pageSize);
      } while (allIssues.length < response.data.total);

      allIssues = allIssues.filter(
        (value, index) => allIssues.indexOf(value) === index
      );

      await fetchIssueData(
        allIssues,
        jiraCreds.email,
        jiraCreds.apiToken,
        res,
        ws
      );
    });
  } catch (error) {
    console.log(error);
    return next(new AppError("500", "Internal server error"));
  }
});

function convertUtcToIst(utcDate) {
  const utcDateTime = new Date(utcDate);
  const istDateTime = new Date(
    utcDateTime.toLocaleString("en-US", { timeZone: "UTC" })
  );
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  };

  const date = (istDateTime.toLocaleDateString("en-US", options)).replace(' at', '');
  const epoch = new Date(date).getTime();

  return epoch;
}

async function makeApiCall(
  callUrl,
  maxRetries,
  delayBetweenRetries,
  username,
  apiToken
) {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await axios.get(callUrl, {
        auth: {
          username,
          password: apiToken,
        },
      });

      return response.data;
    } catch (error) {
      console.error(`Error making Jira API call for ${callUrl}. Retrying...`);
      retries++;
      await new Promise((resolve) => setTimeout(resolve, delayBetweenRetries));
    }
  }
  throw new Error(
    `Unable to fetch data for ${callUrl} after ${maxRetries} retries.`
  );
}

async function fetchIssueData(issueKeys, username, apiToken, res, ws) {
  let changeLogs = [];
  const serverFunctions = require("../server");
  for (const issueKey of issueKeys) {
    try {
      const changelogData = await makeApiCall(
        `${baseUrl}/issue/${issueKey}/changelog`,
        10,
        10000,
        username,
        apiToken
      );

      ws.send(
        JSON.stringify({
          fetchedIssueKey: issueKey,
          userEmail: username,
        })
      );

      changelogData.values.forEach((log) => {
        if (
          log.items[0].field == "status" &&
          log.author.emailAddress == username
        ) {
          changeLogs.push({
            issueKey,
            updatedTime: convertUtcToIst(log.created),
            statusFrom: log.items[0].fromString,
            statusTo: log.items[0].toString,
          });
        }
      });
    } catch (error) {
      console.error(`Failed to fetch data for ${issueKey}:`, error.message);
    }
  }

  ws.send(
    JSON.stringify({
      onDbProgress: true,
      userEmail: username,
    })
  );

  for (const cl of changeLogs) {
    try {
      let queryString1 = `
      INSERT INTO ${"`"}task_summarizer_db${"`"}.${"`"}atlassian_jira${"`"}
      (${"`"}task_key${"`"},
      ${"`"}updated_time${"`"},
      ${"`"}status_from${"`"},
      ${"`"}status_to${"`"},
      ${"`"}user_email${"`"})
      VALUES
      ('${cl.issueKey}',
      '${cl.updatedTime}',
      '${cl.statusFrom}',
      '${cl.statusTo}',
      '${username}');
      `;

      serverFunctions.dbConnection.query(queryString1, (error, result) => {
        if (error)
          return new AppError(
            "500",
            "Error inserting change logs into database"
          );
      });
    } catch (error) {
      console.error("Error inserting change logs into database");
    }
  }

  ws.send(
    JSON.stringify({
      onDbProgressCompleted: true,
      userEmail: username,
    })
  );

  let queryString2 = `
  UPDATE ${"`"}task_summarizer_db${"`"}.${"`"}users${"`"}
  SET ${"`"}jira${"`"} = '${JSON.stringify({
    email: username,
    apiToken,
    isInitFetchCompleted: true,
  })}'
  WHERE ${"`"}email${"`"} = '${username}';
  `;
  serverFunctions.databaseHandler(
    queryString2,
    res,
    `Successfully updated user jira history fetch status`,
    "Internal server error!",
    `Error updating user jira history fetch status`
  );

  ws.send(
    JSON.stringify({
      fetchCompleted: true,
      userEmail: username,
    })
  );
}
