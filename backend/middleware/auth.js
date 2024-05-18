const CatchAsyncError = require("./catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authenticated user
module.exports.isAuthenticated = CatchAsyncError(async (req, res, next) => {
  try {
    const accessToken = req.cookies.access_token;
    if (!accessToken) {
      throw new ErrorHandler("Please login to access this resource", 400);
    }

    // Verify the token and extract the payload
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN);
    console.log(accessToken, decoded);
    // Find the user by ID
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }
    console.log(error);
    req.user = user;
    next();
  } catch (error) {
    // Pass the error to the next middleware for centralized error handling
    next(error);
  }
});

// Validate user role
module.exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};
