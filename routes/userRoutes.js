const bcrypt = require("bcryptjs");
const express = require("express");
const User = require("../models/User");
const {
  getLogin,
  login,
  getRegister,
  register,
  logout,
} = require("../controllers/authController");
const { ensureAuthenticated } = require("../middlewares/auth");
const {
  getUserProfile,
  getEditProfileForm,
  updateUserProfile,
  deleteUserAccount,
} = require("../controllers/userController");
const upload = require("../config/multer");
const userRoutes = express.Router();

// Render login page
userRoutes.get("/profile", ensureAuthenticated, getUserProfile);

// Render edit profile page
userRoutes.get("/edit", ensureAuthenticated, getEditProfileForm);

userRoutes.post(
  "/edit",
  ensureAuthenticated,
  upload.single("profilePicture"),
  updateUserProfile
);

userRoutes.post("/delete", ensureAuthenticated, deleteUserAccount);

module.exports = userRoutes;
