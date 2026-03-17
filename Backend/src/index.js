import dotenv from "dotenv";
import connectDB from "./config/connectDB.js";
import { app } from "./app.js";
import { Server } from "socket.io";

dotenv.config();

const port = process.env.PORT || 8000;

connectDB()
  .then(() => {
    console.log("Database connected");
    const server = app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });

    const io = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: [
          "http://localhost:5173",
          "http://localhost:5174",
          "https://vidhyatransfer-frontend.vercel.app",
          "https://vidhyatransfer-admin.vercel.app",
          "https://vidhya-transfer.vercel.app"
        ],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      console.log("Connected to socket");

      socket.on("setup", (userData) => {
        console.log("Connected to socket in setup: ", userData.username);
        socket.join(userData._id);
        socket.emit("connected");
      });

      socket.on("join chat", (room) => {
        console.log("Joining chat: ", room);
        socket.join(room);
        console.log("Joined chat: ", room);
      });

      socket.on("new message", (newMessage) => {
        // console.log("New message: ", newMessage);
        var chat = newMessage.chatId;
        if (!chat.users) return console.log("Chat.users not defined");
        // console.log("Chat.users: ", chat.users);
        chat.users.forEach((user) => {
          // console.log("User: ", user);
          if (user._id === newMessage.sender._id) return;
          io.to(user._id).emit("message recieved", newMessage);
          console.log("Message sent to: ", user._id);
        });
      });

      // Real-time feed updates
      socket.on("join feed", () => {
        socket.join("feed");
        console.log("Joined feed room");
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from socket");
        socket.broadcast.emit("callEnded");
      });

      // Video Call Events
      socket.on("callUser", ({ userToCall, signalData, from, name }) => {
        io.to(userToCall).emit("callUser", { signal: signalData, from, name });
      });

      socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
      });
    });

    // Make io available globally for controllers
    app.set("io", io);
  })
  .catch((err) => {
    console.log(err);
  });
