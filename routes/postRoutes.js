const express = require("express");
const {
  getPostForm,
  createPost,
  getPosts,
  getPostById,
  getEditPostForm,
  deletePost,
  updatePost,
} = require("../controllers/postController");
const upload = require("../config/multer");
const { ensureAuthenticated } = require("../middlewares/auth");
const postRoutes = express.Router();

// get post form
postRoutes.get("/add", getPostForm);

// post logic
postRoutes.post(
  "/add",
  ensureAuthenticated,
  upload.array("images", 5),
  createPost
);

// get all posts
postRoutes.get("/", getPosts);

// get post by id
postRoutes.get("/:id", getPostById);
postRoutes.get("/:id/edit", getEditPostForm);

// update post
postRoutes.put(
  "/:id",
  ensureAuthenticated,
  upload.array("images", 5),
  updatePost
);

// delete post
postRoutes.delete("/:id", ensureAuthenticated, deletePost);

module.exports = postRoutes;
