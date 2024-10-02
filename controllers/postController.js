const asyncHandler = require("express-async-handler");
const Post = require("../models/Post");
const File = require("../models/File");
const cloudinary = require("../config/cloudinary");

// Rendering post form
exports.getPostForm = asyncHandler((req, res) => {
  res.render("newPost", {
    title: "Create Post",
    user: req.user,
    error: "",
    success: "",
  });
});

exports.createPost = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  console.log(req.files);

  const images = await Promise.all(
    req.files.map(async (file) => {
      // save the images into our database
      const newFile = new File({
        url: file.path,
        public_id: file.filename,
        uploaded_by: req.user._conditions._id,
      });
      await newFile.save();
      console.log(newFile);

      return {
        url: newFile.url,
        public_id: newFile.public_id,
      };
    })
  );

  // create post
  const newPost = new Post({
    title,
    content,
    author: req.user._conditions._id,
    images,
  });
  await newPost.save();
  res.render("newPost", {
    title: "Create Post",
    user: req.user,
    success: "Post created successfully",
    error: "",
  });
});

// Get all posts
exports.getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find().populate("author", "username");
  res.render("posts", {
    title: "Posts",
    user: req.user,
    posts,
    success: "",
    error: "",
  });
});

// get post by id
exports.getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate("author", "username")
    .populate({
      path: "comments",
      populate: {
        path: "author",
        model: "User",
        select: "username",
      },
    });
  // console.log(post);

  res.render("postDetails", {
    title: "Post",
    user: req.user,
    post,
    success: "",
    error: "",
  });
});

// get edit form
exports.getEditPostForm = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.render("postDetails", {
      title: "Post",
      user: req.user,
      post,
      success: "",
      error: "Post not found",
    });
  }
  res.render("editPost", {
    title: "Edit Post",
    user: req.user,
    post,
    success: "",
    error: "",
  });
});

// delete post
exports.deletePost = asyncHandler(async (req, res) => {
  // find the post
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.render("postDetails", {
      title: "Post",
      user: req.user,
      post,
      success: "",
      error: "Post not found",
    });
  }
  if (post.author.toString() !== req.user._conditions._id.toString()) {
    return res.render("postDetails", {
      title: "Post",
      user: req.user,
      post,
      success: "",
      error: "You are not authorized to delete this post",
    });
  }
  await Promise.all(
    post.images.map(async (image) => {
      await cloudinary.uploader.destroy(image.public_id);
    })
  );
  await Post.findByIdAndDelete(req.params.id);
  res.redirect("/posts");
});

exports.updatePost = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.render("postDetails", {
      title: "Post",
      user: req.user,
      comment,
      success: "",
      error: "Post not found",
    });
  }
  if (post.author.toString() !== req.user._conditions._id.toString()) {
    return res.render("postDetails", {
      title: "Post",
      user: req.user,
      comment,
      success: "",
      error: "You are not authorized to edit this post",
    });
  }
  post.title = title || post.title;
  post.content = content || post.content;
  if (req.files && req.files.length > 0) {
    await Promise.all(
      post.images.map(async (image) => {
        await cloudinary.uploader.destroy(image.public_id);
      })
    );

    post.images = await Promise.all(
      req.files.map(async (file) => {
        // save the images into our database
        const newFile = new File({
          url: file.path,
          public_id: file.filename,
          uploaded_by: req.user._conditions._id,
        });
        await newFile.save();

        return {
          url: newFile.url,
          public_id: newFile.public_id,
        };
      })
    );
  }

  await post.save();

  res.redirect(`/posts/${post._id}`);
});
