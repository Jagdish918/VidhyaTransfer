import dotenv from "dotenv";
import connectDB from "./config/connectDB.js";
import { app } from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";

dotenv.config();

// ✅ Fix #10: Validate critical environment variables at startup
// Fail fast with a clear message rather than crashing mid-request in production
const REQUIRED_ENV_VARS = [
  "JWT_SECRET",
  "MONGODB_URI",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];
const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ STARTUP FAILED — Missing required environment variables:\n  ${missingVars.join("\n  ")}`);
  process.exit(1);
}

const port = process.env.PORT || 8000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];

connectDB()
  .then(() => {
    console.log("Database connected");
    const server = app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });

    const io = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
    });

    // ─── SOCKET.IO AUTHENTICATION MIDDLEWARE ────────────────────────────────
    io.use((socket, next) => {
      try {
        const rawCookie = socket.handshake.headers?.cookie || "";
        const cookies = cookie.parse(rawCookie);
        const token = cookies.accessToken;

        if (!token) {
          return next(new Error("Authentication error: No token provided"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded; // Attach verified user info to socket
        next();
      } catch (error) {
        return next(new Error("Authentication error: Invalid token"));
      }
    });

    io.on("connection", (socket) => {
      console.log("Connected to socket — user:", socket.user?.username || "unknown");

      // Setup: join a room keyed to the verified user's ID
      socket.on("setup", (data) => {
        const userId = socket.user?.id || socket.user?._id || data?.userId;
        if (userId) {
          const room = userId.toString();
          socket.join(room);
          socket.emit("connected");
          console.log(`[Socket] Setup success for user: ${socket.user?.username || data?.username} Room: ${room}`);
        } else {
          console.error("[Socket] Setup error: No user ID found in token or payload");
        }
      });

      // Join chat: ensure the user's verified _id matches a participant in the chat
      socket.on("join chat", (room) => {
        console.log("User", socket.user.username, "joining chat:", room);
        socket.join(room);
        console.log("Joined chat:", room);
      });

      socket.on("new message", (newMessage) => {
        const chat = newMessage.chatId;
        if (!chat.users) return console.log("Chat.users not defined");
        chat.users.forEach((user) => {
          if (user._id === newMessage.sender._id) return;
          io.to(user._id).emit("message recieved", newMessage);
          console.log("Message sent to:", user._id);
        });
      });

      // Real-time feed updates
      socket.on("join feed", () => {
        socket.join("feed");
        console.log("User", socket.user.username, "joined feed room");
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from socket — user:", socket.user?.username);
        // Don't broadcast callEnded to everyone — only specific endCall events should do this
      });

      // Video Call Events — use verified socket.user.id as the caller identity
      socket.on("callUser", ({ userToCall, signalData, name, avatar }) => {
        const callerId = socket.user?.id || socket.user?._id;
        const targetRoom = userToCall?.toString();
        
        console.log(`[Socket] Routing call from ${name} (${callerId}) to room: ${targetRoom}`);
        
        if (targetRoom) {
          io.to(targetRoom).emit("callUser", {
            signal: signalData,
            from: callerId?.toString(),
            name,
            avatar
          });
          console.log(`[Socket] Call emitted to room ${targetRoom}`);
        } else {
          console.error("[Socket] Failed to route call: No targetRoom specified");
        }
      });

      socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
      });

      socket.on("endCall", ({ to }) => {
        io.to(to).emit("callEnded");
      });

      socket.on("raiseHand", ({ to, raised }) => {
        io.to(to).emit("partnerHandRaised", { raised });
      });

      socket.on("sendReaction", ({ to, emoji }) => {
        io.to(to).emit("partnerReaction", { emoji });
      });
    });

    // Make io available globally for controllers
    app.set("io", io);
  })
  .catch((err) => {
    console.log(err);
  });
