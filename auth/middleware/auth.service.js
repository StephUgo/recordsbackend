const jwt = require("jsonwebtoken");
const config = require("config");

// Export an Express middleware function to use on routes which requires authentication
module.exports = function(req, res, next) {
  // Retrieve the token from the header if present
  const token = req.headers["x-access-token"] || req.headers["authorization"];
  // If no token found, return a 401 error (so without going to the next middelware)
  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
    // If we can verify the token, set the decoded user (_id and isAdmin) to the request and pass to next middleware
    const decoded = jwt.verify(token, config.get("privateKey"));
    req.user = decoded;
    next();
  } catch (ex) {
    // Invalid token
    res.status(400).send("Invalid token.");
  }
};