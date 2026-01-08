import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Post } from "../../models/post.model.js";
import { User } from "../../models/user.model.js";

// Helper function for basic content moderation
const moderateContent = (content) => {
  const inappropriateWords = ["spam", "scam", "fraud"]; // Add more words as needed
  const contentLower = content.toLowerCase();
  return inappropriateWords.some((word) => contentLower.includes(word));
};

// Create post
export const createPost = asyncHandler(async (req, res) => {
  const { content, skills } = req.body;
  const userId = req.user._id || req.user.id;
  const io = req.app.get("io");

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Post content is required");
  }

  if (content.length > 1000) {
    throw new ApiError(400, "Post content should be less than 1000 characters");
  }

  // Basic moderation
  const hasInappropriateContent = moderateContent(content);

  const post = await Post.create({
    author: userId,
    content: content.trim(),
    skills: skills || [],
    isModerated: hasInappropriateContent,
  });

  await post.populate("author", "name picture username");

  // Emit real-time update
  if (io) {
    io.to("feed").emit("new post", post);
  }

  return res.status(201).json(
    new ApiResponse(201, post, "Post created successfully")
  );
});

// Get feed with pagination
export const getFeed = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const domain = req.query.domain; // Filter by domain/category
  const skip = (page - 1) * limit;

  let query = { isDeleted: false, isModerated: false };

  if (domain && domain !== "All") {
    query["skills.category"] = domain;
  }

  const posts = await Post.find(query)
    .populate("author", "name picture username")
    .populate("likes", "name picture")
    .populate("comments.user", "name picture username")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + posts.length < total,
    }, "Feed retrieved successfully")
  );
});

// Like/Unlike post
export const toggleLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id || req.user.id;
  const io = req.app.get("io");

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const isLiked = post.likes.some((id) => id.toString() === userId.toString());

  if (isLiked) {
    post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
  } else {
    post.likes.push(userId);
  }

  await post.save();

  // Emit real-time update
  if (io) {
    io.to("feed").emit("post updated", {
      postId: post._id,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    });
  }

  return res.status(200).json(
    new ApiResponse(200, {
      isLiked: !isLiked,
      likesCount: post.likes.length,
    }, isLiked ? "Post unliked" : "Post liked")
  );
});

// Add comment
export const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.user._id || req.user.id;
  const io = req.app.get("io");

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Comment content is required");
  }

  if (content.length > 500) {
    throw new ApiError(400, "Comment should be less than 500 characters");
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  post.comments.push({
    user: userId,
    content: content.trim(),
  });

  await post.save();
  await post.populate("comments.user", "name picture username");

  const newComment = post.comments[post.comments.length - 1];

  // Emit real-time update
  if (io) {
    io.to("feed").emit("post updated", {
      postId: post._id,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    });
  }

  return res.status(201).json(
    new ApiResponse(201, newComment, "Comment added successfully")
  );
});

// Delete post (soft delete)
export const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id || req.user.id;

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // Only author can delete
  if (post.author.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized to delete this post");
  }

  post.isDeleted = true;
  await post.save();

  return res.status(200).json(
    new ApiResponse(200, null, "Post deleted successfully")
  );
});

// Report post (for moderation)
export const reportPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { reason } = req.body;

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  post.reportedCount += 1;

  // Auto-moderate if reported multiple times
  if (post.reportedCount >= 3) {
    post.isModerated = true;
  }

  await post.save();

  return res.status(200).json(
    new ApiResponse(200, null, "Post reported successfully")
  );
});

