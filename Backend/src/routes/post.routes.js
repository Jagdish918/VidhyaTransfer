import { Router } from "express";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  createPost,
  getFeed,
  toggleLike,
  addComment,
  deletePost,
  reportPost,
} from "../controllers/user/post.controllers.js";

const router = Router();

router.route("/").post(verifyJWT_username, upload.array("attachments", 4), createPost);
router.route("/feed").get(verifyJWT_username, getFeed);
router.route("/:postId/like").post(verifyJWT_username, toggleLike);
router.route("/:postId/comment").post(verifyJWT_username, addComment);
router.route("/:postId").delete(verifyJWT_username, deletePost);
router.route("/:postId/report").post(verifyJWT_username, reportPost);

export default router;


