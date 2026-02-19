import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { Report } from "../models/report.model.js";
import { Request } from "../models/request.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getDashboardStats = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments({ isDeleted: false });
    const reportedPosts = await Post.countDocuments({ reportedCount: { $gt: 0 } });

    return res.status(200).json(
        new ApiResponse(200, { totalUsers, totalPosts, reportedPosts }, "Dashboard stats fetched successfully")
    );
});

const getAllUsers = asyncHandler(async (req, res) => {
    // Basic pagination could be added later
    const users = await User.find().select("-password").sort({ createdAt: -1 }).limit(50);
    return res.status(200).json(
        new ApiResponse(200, users, "Users fetched successfully")
    );
});

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    return res.status(200).json(
        new ApiResponse(200, null, "User deleted successfully")
    );
});

const banUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
        id,
        {
            status: "banned",
            refreshToken: null // Force logout
        },
        { new: true }
    );
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    return res.status(200).json(
        new ApiResponse(200, user, "User banned successfully")
    );
});

const unbanUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
        id,
        { status: "active" },
        { new: true }
    );
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    return res.status(200).json(
        new ApiResponse(200, user, "User unbanned successfully")
    );
});

const getAllPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find({ isDeleted: false })
        .populate("author", "name email picture")
        .sort({ createdAt: -1 })
        .limit(50);
    return res.status(200).json(
        new ApiResponse(200, posts, "Posts fetched successfully")
    );
});

const deletePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!post) {
        throw new ApiError(404, "Post not found");
    }
    return res.status(200).json(
        new ApiResponse(200, null, "Post deleted successfully")
    );
});





const getReports = asyncHandler(async (req, res) => {
    // ... existing getReports code
    const reports = await Report.find()
        .populate("reporter", "name email picture")
        .populate("reported", "name email picture status")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, reports, "Reports fetched successfully"));
});

// ... existing deleteReport and getReportedPosts

const deleteReport = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await Report.findByIdAndDelete(id);
    return res.status(200).json(new ApiResponse(200, {}, "Report dismissed"));
});

const getReportedPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find({ reportedCount: { $gt: 0 }, isDeleted: false })
        .populate("author", "name email picture")
        .sort({ reportedCount: -1 });
    return res.status(200).json(new ApiResponse(200, posts, "Reported posts fetched"));
});

const getAnalytics = asyncHandler(async (req, res) => {
    // Top 5 Skills
    const topSkills = await User.aggregate([
        { $unwind: "$skillsProficientAt" },
        { $group: { _id: "$skillsProficientAt.name", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
    ]);

    // Request Stats
    const totalRequests = await Request.countDocuments();
    const successfulConnections = await Request.countDocuments({ status: "Connected" });

    return res.status(200).json(new ApiResponse(200, { topSkills, totalRequests, successfulConnections }, "Analytics data"));
});

const getPlatformActivity = asyncHandler(async (req, res) => {
    const activity = await Request.find()
        .populate("sender", "name email")
        .populate("receiver", "name email")
        .sort({ createdAt: -1 })
        .limit(50);
    return res.status(200).json(new ApiResponse(200, activity, "Activity logs"));
});

export {
    getDashboardStats,
    getAllUsers,
    deleteUser,
    banUser,
    unbanUser,
    getAllPosts,
    deletePost,
    getReports,
    deleteReport,
    getReportedPosts,
    getAnalytics,
    getPlatformActivity
};
