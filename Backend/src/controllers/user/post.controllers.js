import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Post } from "../../models/post.model.js";
import { User } from "../../models/user.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../../config/connectCloudinary.js";
import { Request } from "../../models/request.model.js";

// Helper function for basic content moderation
const moderateContent = (content) => {
  const inappropriateWords = ["spam", "scam", "fraud"]; // Add more words as needed
  const contentLower = content.toLowerCase();
  return inappropriateWords.some((word) => contentLower.includes(word));
};

// Create post
export const createPost = asyncHandler(async (req, res) => {
  let { content, skills } = req.body;
  const userId = req.user._id || req.user.id;
  const io = req.app.get("io");

  // Parse skills if it comes as a string (from FormData)
  if (typeof skills === 'string') {
    try {
      skills = JSON.parse(skills);
    } catch (e) {
      skills = [];
    }
  }

  if (!content || content.trim().length === 0) {
    if ((!req.files || req.files.length === 0)) {
      throw new ApiError(400, "Post content is required");
    }
    // Allow empty content if there are attachments, but set content to empty string
    content = "";
  }

  if (content.length > 1000) {
    throw new ApiError(400, "Post content should be less than 1000 characters");
  }

  // Handle Attachments Upload
  const attachments = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const localPath = file.path;
      const uploadResult = await uploadOnCloudinary(localPath);
      if (uploadResult && uploadResult.url) {
        attachments.push(uploadResult.url);
      }
    }
  }

  // Basic moderation
  const hasInappropriateContent = moderateContent(content);

  const post = await Post.create({
    author: userId,
    content: content.trim(),
    skills: skills || [],
    attachments: attachments,
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
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // ✅ FIX: cap at 100 to prevent DoS
  const domain = req.query.domain; // Filter by domain/category
  const skip = (page - 1) * limit;
  const currentUserId = req.user._id || req.user.id;

  let query = { isDeleted: false, isModerated: false };

  if (domain && domain !== "All") {
    query["skills.category"] = domain;
  }

  const posts = await Post.find(query)
    .populate("author", "name picture username")
    .populate({
      path: "comments.user",
      select: "name picture username"
    })
    .populate({
      path: "comments.replies.user",
      select: "name picture username"
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments(query);

  // Attach connection status dynamically
  const authorIds = [...new Set(
    posts.filter(post => post.author && post.author._id)
      .map(post => post.author._id.toString())
  )];
  const requests = await Request.find({
    $or: [
      { sender: currentUserId, receiver: { $in: authorIds } },
      { sender: { $in: authorIds }, receiver: currentUserId }
    ]
  });

  const connectionStatusMap = {};
  requests.forEach(r => {
    const otherId = r.sender.toString() === currentUserId.toString() ? r.receiver.toString() : r.sender.toString();
    connectionStatusMap[otherId] = r.status;
  });

  const postsWithStatus = posts.map(post => {
    const postObj = post.toObject();
    if (postObj.author) {
      const isMe = postObj.author._id.toString() === currentUserId.toString();
      postObj.author.status = isMe ? null : (connectionStatusMap[postObj.author._id.toString()] || "Connect");
    }
    return postObj;
  });

  return res.status(200).json(
    new ApiResponse(200, {
      posts: postsWithStatus,
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

  let updatedPost;
  if (isLiked) {
    updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $pull: { likes: userId } },
      { new: true }
    );
  } else {
    updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $addToSet: { likes: userId } },
      { new: true }
    );
  }

  // Emit real-time update
  if (io) {
    io.to("feed").emit("post updated", {
      postId: updatedPost._id,
      likesCount: updatedPost.likes.length,
      commentsCount: updatedPost.comments.length,
      userId: userId,
      type: "like"
    });
  }

  return res.status(200).json(
    new ApiResponse(200, {
      isLiked: !isLiked,
      likesCount: updatedPost.likes.length,
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
      comment: newComment,
      type: "comment"
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

  // Delete all attached media from Cloudinary
  if (post.attachments && post.attachments.length > 0) {
    console.log(`Deleting ${post.attachments.length} media files from Cloudinary...`);

    for (const fileUrl of post.attachments) {
      try {
        const result = await deleteFromCloudinary(fileUrl);

        if (result) {
          console.log(`Successfully deleted media: ${fileUrl}`);
        } else {
          console.log(`Failed to delete media: ${fileUrl}`);
        }
      } catch (error) {
        console.error(`Error deleting media ${fileUrl}:`, error);
        // Continue with other files even if one fails
      }
    }
  }

  // Mark post as deleted
  post.isDeleted = true;
  await post.save();

  return res.status(200).json(
    new ApiResponse(200, null, "Post and all media deleted successfully")
  );
});

// Report post (for moderation)
export const reportPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // ✅ FIX: Prevent self-reporting a post
  if (post.author.toString() === userId.toString()) {
    throw new ApiError(400, "You cannot report your own post");
  }

  // ✅ FIX: Prevent duplicate reports — track who has already reported
  if (!post.reportedBy) post.reportedBy = [];
  const alreadyReported = post.reportedBy.some(
    (id) => id.toString() === userId.toString()
  );
  if (alreadyReported) {
    throw new ApiError(429, "You have already reported this post");
  }

  post.reportedBy.push(userId);
  post.reportedCount = post.reportedBy.length;

  // Auto-moderate only after 5 UNIQUE reporters (not 3)
  if (post.reportedCount >= 5) {
    post.isModerated = true;
  }

  await post.save();

  return res.status(200).json(
    new ApiResponse(200, null, "Post reported successfully")
  );
});

// Like / Unlike a comment
export const likeComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.user._id || req.user.id;

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const comment = post.comments.id(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  const alreadyLiked = comment.likes.some(id => id.toString() === userId.toString());

  if (alreadyLiked) {
    await Post.updateOne(
      { _id: postId, "comments._id": commentId },
      { $pull: { "comments.$.likes": userId } }
    );
  } else {
    await Post.updateOne(
      { _id: postId, "comments._id": commentId },
      { $addToSet: { "comments.$.likes": userId } }
    );
  }

  const updatedPost = await Post.findById(postId);
  const updatedComment = updatedPost.comments.id(commentId);

  return res.status(200).json(
    new ApiResponse(200, {
      isLiked: !alreadyLiked,
      likesCount: updatedComment.likes.length
    }, "Comment like toggled")
  );
});

// Reply to a comment
export const replyToComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;
  const { content } = req.body;
  const userId = req.user._id || req.user.id;

  if (!content || content.trim().length === 0) throw new ApiError(400, "Reply content is required");

  // ✅ FIX: Add character limit matching comments (500 chars)
  if (content.length > 500) throw new ApiError(400, "Reply should be less than 500 characters");

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const comment = post.comments.id(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  comment.replies.push({ user: userId, content: content.trim() });
  await post.save();
  await post.populate("comments.replies.user", "name picture username");

  const newReply = comment.replies[comment.replies.length - 1];
  return res.status(201).json(new ApiResponse(201, newReply, "Reply added"));
});

// Like / Unlike a reply
export const likeReply = asyncHandler(async (req, res) => {
  const { postId, commentId, replyId } = req.params;
  const userId = req.user._id || req.user.id;

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const comment = post.comments.id(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  const reply = comment.replies.id(replyId);
  if (!reply) throw new ApiError(404, "Reply not found");

  const alreadyLiked = reply.likes.some(id => id.toString() === userId.toString());

  if (alreadyLiked) {
    await Post.updateOne(
      { _id: postId, "comments._id": commentId, "comments.replies._id": replyId },
      { $pull: { "comments.$[comment].replies.$[reply].likes": userId } },
      {
        arrayFilters: [{ "comment._id": commentId }, { "reply._id": replyId }]
      }
    );
  } else {
    await Post.updateOne(
      { _id: postId, "comments._id": commentId, "comments.replies._id": replyId },
      { $addToSet: { "comments.$[comment].replies.$[reply].likes": userId } },
      {
        arrayFilters: [{ "comment._id": commentId }, { "reply._id": replyId }]
      }
    );
  }

  const updatedPost = await Post.findById(postId);
  const updatedReply = updatedPost.comments.id(commentId).replies.id(replyId);

  return res.status(200).json(
    new ApiResponse(200, {
      isLiked: !alreadyLiked,
      likesCount: updatedReply.likes.length
    }, "Reply like toggled")
  );
});
