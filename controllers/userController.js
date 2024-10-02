const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Post = require("../models/Post");
const File = require("../models/File");
const cloudinary = require("../config/cloudinary");
const Comment = require("../models/Comment");

// get user profile
exports.getUserProfile = asyncHandler(async (req, res) => {
  // find the user
  const user = await User.findById(req.user._conditions._id).select(
    "-password"
  );

  if (!user) {
    return res.render("login", {
      title: "Login",
      user: req.user,
      success: "",
      error: "User not found",
    });
  }
  // fetch user's posts
  const posts = await Post.find({ author: req.user._conditions._id }).sort({
    createdAt: -1,
  });
  res.render("profile", {
    title: "Profile",
    user: user,
    posts,
    error: "",
    postCount: posts.length,
  });
});

// get edit profile form
exports.getEditProfileForm = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._conditions._id).select(
    "-password"
  );
  if (!user) {
    return res.render("login", {
      title: "Login",
      user: req.user,
      success: "",
      error: "User not found",
    });
  }
  res.render("editProfile", {
    title: "Edit Profile",
    user,
    success: "",
    error: "",
  });
});

// update profile
exports.updateUserProfile = asyncHandler(async (req, res) => {
  const { username, email, bio } = req.body;
  const user = await User.findById(req.user._conditions._id).select(
    "-password"
  );
  if (!user) {
    return res.render("login", {
      title: "Login",
      user: req.user,
      success: "",
      error: "User not found",
    });
  }
  user.username = username || user.username;
  user.email = email || user.email;
  user.bio = bio || user.bio;

  if (req.file) {
    if (user.profilePicture && user.profilePicture.public_id) {
      await cloudinary.uploader.destroy(user.profilePicture.public_id);
    }
    const file = await File({
      url: req.file.path,
      public_id: req.file.filename,
      uploaded_by: req.user._conditions._id,
    });

    await file.save();
    user.profilePicture = {
      url: file.url,
      public_id: file.public_id,
    };
  }

  await user.save();
  res.render("editProfile", {
    title: "Edit Profile",
    user,
    success: "Profile updated successfully",
    error: null,
  });
});

// Delete user account
exports.deleteUserAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._conditions._id);
  if (!user) {
    return res.render("login", {
      title: "Login",
      user: req.user,
      success: "",
      error: "User not found",
    });
  }
  // Delete user's profile picture from Cloudinary
  if (user.profilePicture && user.profilePicture.public_id) {
    await cloudinary.uploader.destroy(user.profilePicture.public_id);
  }

  // Delete all posts created by the user and their associated images and comments
  const posts = await Post.find({ author: req.user._conditions._id });
  for (const post of posts) {
    for (const image of post.images) {
      await cloudinary.uploader.destroy(image.public_id);
    }
    await Comment.deleteMany({ post: post._id });
    await Post.findByIdAndDelete(post._id);
  }
  // Delete all comments made by the user
  await Comment.deleteMany({ author: req.user._conditions._id });

  // Delete all files uploaded by the user
  const files = await File.find({ uploaded_by: req.user._conditions._id });
  for (const file of files) {
    await cloudinary.uploader.destroy(file.public_id);
  }

  await User.findByIdAndDelete(req.user._conditions._id);
  res.redirect("/auth/register");
});
