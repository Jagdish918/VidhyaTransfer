import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/connectDB.js";
import { app } from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { User } from "./models/user.model.js";
import { Request } from "./models/request.model.js";
import { Message } from "./models/message.model.js";

// ✅ Start logic moved down helper
const broadcastStatus = async (userId, isOnline, io) => {
  try {
    const connections = await Request.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: "Connected",
    });

    const peers = connections.map((c) =>
      c.sender.toString() === userId.toString() ? c.receiver.toString() : c.sender.toString()
    );

    peers.forEach((peerId) => {
      io.to(peerId).emit("user status update", {
        userId,
        isOnline,
        lastSeen: isOnline ? null : Date.now(),
      });
    });
  } catch (err) {
    console.error("Error broadcasting status:", err);
  }
};

const port = process.env.PORT || 8000;
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "https://vidhya-transfer.duckdns.org"];

connectDB()
  .then(() => {
    console.log("Database connected");
    const server = app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });

    const io = new Server(server, {
      pingTimeout: 60000,
      cors: { origin: allowedOrigins, credentials: true },
    });

    io.use(async (socket, next) => {
      try {
        const rawCookie = socket.handshake.headers?.cookie || "";
        const cookies = cookie.parse(rawCookie);
        const token = cookies.accessToken;
        if (!token) return next(new Error("No token"));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ username: decoded.username }).select("status tokenVersion");
        if (!user || user.status === "banned") return next(new Error("Auth failed"));

        socket.user = decoded;
        next();
      } catch (error) {
        return next(new Error("Auth error"));
      }
    });

    io.on("connection", (socket) => {
      socket.on("setup", async (data) => {
        const userId = socket.user?.id || socket.user?._id;
        if (userId) {
          socket.join(userId.toString());
          await User.findByIdAndUpdate(userId, { isOnline: true });
          broadcastStatus(userId, true, io);
          socket.emit("connected");
        }
      });

      socket.on("join chat", (room) => socket.join(room));

      socket.on("new message", (newMessage) => {
        const senderId = socket.user?.id || socket.user?._id;
        const chat = newMessage.chatId;
        if (!chat.users) return;

        chat.users.forEach((user) => {
          const targetId = user._id.toString();
          if (targetId === senderId.toString()) return;
          io.to(targetId).emit("message received", newMessage);
        });
      });

      socket.on("message read", async ({ messageId, chatId }) => {
        try {
          const userId = socket.user?.id || socket.user?._id;
          const msg = await Message.findById(messageId);
          if (msg && msg.sender.toString() !== userId.toString()) {
            msg.isRead = true;
            msg.readAt = Date.now();
            await msg.save();
            io.to(msg.sender.toString()).emit("message seen", { messageId, chatId, readAt: msg.readAt });
          }
        } catch (err) { console.error("Message read error", err); }
      });

      socket.on("disconnect", async () => {
        const userId = socket.user?.id || socket.user?._id;
        if (userId) {
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: Date.now() });
          broadcastStatus(userId, false, io);
        }
      });

      socket.on("callUser", ({ userToCall, signalData, name, avatar }) => {
        io.to(userToCall.toString()).emit("callUser", { signal: signalData, from: socket.user.id, name, avatar });
      });
      socket.on("answerCall", (data) => io.to(data.to).emit("callAccepted", data.signal));
      socket.on("endCall", ({ to }) => io.to(to).emit("callEnded"));
      socket.on("typing", (room) => socket.in(room).emit("typing", room));
      socket.on("stop typing", (room) => socket.in(room).emit("stop typing", room));
    });
    app.set("io", io);
  })
  .catch((err) => {
    console.log(err);
  });
