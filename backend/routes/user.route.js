const express = require("express");
const {
  getUserInfo,
  loginUser,
  logoutUser,
  registerUser,
  socialAuth,
  updatePassword,
  updateProfilePicture,
  updateUserInfo,
  getAllUsers,
  updateUserRole,
  getInstructors,
  refreshTokenHandler,
} = require("../controllers/user.controller");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");

const userRouter = express.Router();

userRouter.post("/register", registerUser);
// userRouter.post("/activate-user", activateUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", isAuthenticated, logoutUser);
userRouter.get("/refresh-token", isAuthenticated, refreshTokenHandler);
userRouter.get("/me", isAuthenticated, getUserInfo);
userRouter.post("/social-auth", socialAuth);
userRouter.put("/update-user-info", isAuthenticated, updateUserInfo);
userRouter.put(isAuthenticated, updatePassword);
userRouter.put("/update-user-avatar", isAuthenticated, updateProfilePicture);

//FOR ADMINS ONLY
userRouter.get(
  "/get-all-users",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllUsers
);

userRouter.put(
  "/update-user-role/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  updateUserRole
);

userRouter.get("/instructors", getInstructors);
module.exports = userRouter;
