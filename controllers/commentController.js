const asyncHandler = require("express-async-handler");
const Comment = require("../models/Comment");
const Post = require("../models/Post");

exports.addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const postId = req.params.id;
  // find the post
  const post = await Post.findById(postId);
  // validation

  if (!post) {
    return res.render("postDetails", {
      title: "Post",
      user: req.user,
      post,
      success: "",
      error: "Post not found",
    });
  }
  if (!content) {
    return res.render("postDetails", {
      title: "Post",
      user: req.user,
      post,
      success: "",
      error: "Content is required",
    });
  }
  // save comment
  const comment = new Comment({
    content,
    post: postId,
    author: req.user._conditions._id,
  });
  await comment.save();
  // push comment
  post.comments.push(comment._id);
  await post.save();
  console.log(post);

  res.redirect(`/posts/${postId}`);
});

// get comment form
exports.getCommentForm = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return res.render("postDetails", {
      title: "Post",
      user: req.user,
      comment,
      success: "",
      error: "Post not found",
    });
  }
  res.render("editComment", {
    title: "Comment",
    user: req.user,
    comment,
    error: "",
    success: "",
  });
});

// update comment
exports.updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return res.render("postDetails", {
      title: "Post",
      user: req.user,
      comment,
      success: "",
      error: "Comment not found",
    });
  }
  if (comment.author.toString() !== req.user._conditions._id.toString()) {
    return res.render("postDetails", {
      title: "Post",
      user: req.user,
      comment,
      success: "",
      error: "You are not authorized to edit this comment",
    });
  }
  comment.content = content || comment.content;
  await comment.save();
  res.redirect(`/posts/${comment.post}`);
});

// delete comment
exports.deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return res.render("postDetails", {
      title: "Post",
      user: req.user,
      comment,
      success: "",
      error: "Comment not found",
    });
  }
  if (comment.author.toString() !== req.user._conditions._id.toString()) {
    return res.render("postDetails", {
      title: "Post",
      user: req.user,
      comment,
      success: "",
      error: "You are not authorized to delete this comment",
    });
  }
  await Comment.findByIdAndDelete(req.params.id);
  res.redirect(`/posts/${comment.post}`);
});
