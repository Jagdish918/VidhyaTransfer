import { Router } from "express";
import {
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
} from "../controllers/admin.controllers.js";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

// Protect all admin routes
router.use(verifyJWT_username);
router.use(verifyAdmin); // Ensures only admins can access

router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/ban", banUser);
router.patch("/users/:id/unban", unbanUser);
router.get("/posts", getAllPosts);
router.get("/posts/reported", getReportedPosts);
router.delete("/posts/:id", deletePost);
router.get("/reports", getReports);
router.delete("/reports/:id", deleteReport);
router.get("/analytics", getAnalytics);
router.get("/activity", getPlatformActivity);

export default router;
