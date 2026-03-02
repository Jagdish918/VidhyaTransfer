import express from "express";
import { sendMessage, getMessages, deleteMessage, reactToMessage } from "../controllers/chat/message.controllers.js";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";

const router = express.Router();

router.post("/sendMessage", verifyJWT_username, sendMessage);
router.get("/getMessages/:chatId", verifyJWT_username, getMessages);
router.delete("/:messageId", verifyJWT_username, deleteMessage);
router.patch("/:messageId/react", verifyJWT_username, reactToMessage);

export default router;
