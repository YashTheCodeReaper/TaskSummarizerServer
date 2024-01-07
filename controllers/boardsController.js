const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const decodeUserId = require("../utils/decodeUserId");

exports.createBoard = catchAsync(async (req, res, next) => {
  try {
    let boardObj = {
      name: req.body.name,
      description: req.body.description,
      trackables: req.body.trackables,
      accessibility_constraints: req.body.accessibilityConstraints,
      time_constraints: req.body.timeConstraints,
      linked_teams: [],
    };

    boardObj.user_id = await decodeUserId(req);

    let queryString = `
    INSERT INTO ${"`"}task_summarizer_db${"`"}.${"`"}boards${"`"}
    (${"`"}board_id${"`"},
    ${"`"}name${"`"},
    ${"`"}description${"`"},
    ${"`"}trackables${"`"},
    ${"`"}accessibility_constraints${"`"},
    ${"`"}user_id${"`"},
    ${"`"}time_constraints${"`"},
    ${"`"}linked_teams${"`"})
    VALUES
    (UUID(),
    "${boardObj.name}",
    "${boardObj.description}",
    '${JSON.stringify(boardObj.trackables)}',
    '${JSON.stringify(boardObj.accessibility_constraints)}',
    '${boardObj.user_id}',
    '${JSON.stringify(boardObj.time_constraints)}',
    '${JSON.stringify(boardObj.linked_teams)}');
    `;

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully created a new board`,
      "Internal server error!",
      "Error creating a new board!"
    );
  } catch (error) {
    console.error(error);
    return next(new AppError("500", "Internal server error"));
  }
});

exports.getAllBoards = catchAsync(async (req, res, next) => {
  try {
    let user_id = await decodeUserId(req);

    let queryString = `
    SELECT * FROM ${"`"}task_summarizer_db${"`"}.${"`"}boards${"`"}
    WHERE ${"`"}user_id${"`"} = '${user_id}';
    `;

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully fetched all boards`,
      "Internal server error!",
      "Error fetching all boards!"
    );
  } catch (error) {
    console.error(error);
    return next(new AppError("500", "Internal server error"));
  }
});

exports.addLinkedTeam = catchAsync(async (req, res, next) => {
  try {
    let linkTeamObj = {
      board_id: req.body.boardId,
      team_id: req.body.teamToLink,
    };

    let queryString = `
    UPDATE ${"`"}task_summarizer_db${"`"}.${"`"}boards${"`"}
    SET ${"`"}linked_teams${"`"} = JSON_ARRAY_APPEND(${"`"}linked_teams${"`"}, '$', '${
      linkTeamObj.team_id
    }')
    WHERE ${"`"}board_id${"`"} = '${linkTeamObj.board_id}';
    `;

    console.log(queryString);

    const serverFunctions = require("../server");
    serverFunctions.databaseHandler(
      queryString,
      res,
      `Successfully updated linked teams in a board`,
      "Internal server error!",
      "Error updating linked teams in a board!"
    );
  } catch (error) {
    console.error(error);
    return next(new AppError("500", "Internal server error"));
  }
});
