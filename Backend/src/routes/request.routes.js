import express from "express";
import { createRequest, getRequests, acceptRequest, rejectRequest, cancelRequest, getSentRequests, disconnectUser } from "../controllers/user/request.controllers.js";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";

const router = express.Router();

router.post("/create", verifyJWT_username, createRequest);
router.get("/getRequests", verifyJWT_username, getRequests);
router.post("/acceptRequest", verifyJWT_username, acceptRequest);
router.post("/rejectRequest", verifyJWT_username, rejectRequest);
router.post("/cancel", verifyJWT_username, cancelRequest);
router.get("/getSentRequests", verifyJWT_username, getSentRequests);
router.post("/disconnect", verifyJWT_username, disconnectUser);

export default router;
