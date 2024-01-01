const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const decodeUserId = async (req) => {
  const decodedToken = await promisify(jwt.verify)(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );

  return decodedToken.id;
};

module.exports = decodeUserId;
