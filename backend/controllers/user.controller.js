require("dotenv").config();
const userModel = require("../models/User");
const ErrorHandler = require("../utils/ErrorHandler");
const CatchAsyncError = require("../middleware/catchAsyncErrors");
const jwt = require("jsonwebtoken");

const { sendToken } = require("../utils/jwt");
const cloudinary = require("cloudinary");

console.log(ErrorHandler);
//* Register User
const registerUser = CatchAsyncError(async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const isEmailExists = await userModel.findOne({ email });

    if (isEmailExists) {
      return next(new ErrorHandler("Email already exists", 400));
    }

    const user = await userModel.create({
      name,
      email,
      password,
    });

    sendToken(user, 201, res, { expiresIn: "7d" });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Login User
const loginUser = CatchAsyncError(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorHandler("Please enter email and password", 400));
    }

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorHandler("Invalid email or password", 400));
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return next(new ErrorHandler("Invalid email or password", 400));
    }

    sendToken(user, 200, res, { expiresIn: "7d" }); // Set token expiry to 7 days
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Logout User
const logoutUser = CatchAsyncError(async (req, res, next) => {
  try {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
//REFRESH TOKEN
const refreshTokenHandler = CatchAsyncError(async (req, res, next) => {
  const { refresh_token } = req.cookies;

  if (!refresh_token) {
    return next(new ErrorHandler("No refresh token provided", 403));
  }

  try {
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN);
    const user = await userModel.findById(decoded.id);

    if (!user || user.refreshToken !== refresh_token) {
      return next(new ErrorHandler("Invalid refresh token", 403));
    }

    sendToken(user, 200, res); // Reissue access token
  } catch (error) {
    return next(new ErrorHandler(error.message, 403));
  }
});

// Get User Info
const getUserInfo = CatchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user?._id;
    console.log(req.user);
    console.log(userId);
    const user = await userModel.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
    console.log(user);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Social Auth
const socialAuth = CatchAsyncError(async (req, res, next) => {
  try {
    const { email, name, avatar } = req.body;
    let user = await userModel.findOne({ email });
    if (!user) {
      user = await userModel.create({ email, name, avatar });
    }
    sendToken(user, 200, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Update User Info
const updateUserInfo = CatchAsyncError(async (req, res, next) => {
  try {
    const { name } = req.body;
    const userId = req.user?._id;
    const user = await userModel.findById(userId);

    if (name && user) {
      user.name = name;
    }
    await user.save();
    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Update User Password
const updatePassword = CatchAsyncError(async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return next(new ErrorHandler("Please enter old and new password", 400));
    }
    const user = await userModel.findById(req.user?._id).select("+password");
    if (!user) {
      return next(new ErrorHandler("Invalid user", 400));
    }
    const isPasswordMatch = await user.comparePassword(oldPassword);
    if (!isPasswordMatch) {
      return next(new ErrorHandler("Invalid Old Password", 400));
    }
    user.password = newPassword;
    await user.save();
    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Update Profile Picture
const updateProfilePicture = CatchAsyncError(async (req, res, next) => {
  try {
    const { avatar } = req.body;
    const userId = req.user?._id;
    const user = await userModel.findById(userId);
    if (avatar && user) {
      if (user.avatar?.public_id) {
        // Delete the old image
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      }
      const myCloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: "avatar",
        width: 150,
      });
      user.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }
    await user.save();
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
// Get All Users (Admin only)
const getAllUsers = CatchAsyncError(async (req, res, next) => {
  try {
    const users = await userModel
      .find()
      .select("avatar name email role")
      .sort({ createdAt: -1 });
    res.status(201).json({
      success: true,
      users,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

const updateUserRole = CatchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await userModel.findById(id);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

const getInstructors = CatchAsyncError(async (req, res, next) => {
  try {
    const instructors = await userModel
      .find({ role: "instructor" })
      .select("avatar name email role")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      instructors,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

module.exports = {
  registerUser,

  loginUser,
  logoutUser,

  getUserInfo,
  socialAuth,
  updateUserInfo,
  updatePassword,
  updateProfilePicture,
  getAllUsers,
  updateUserRole,
  getInstructors,
  refreshTokenHandler,
};
