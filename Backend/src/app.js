import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";

const app = express();

// ✅ Allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://vidhyatransfer-frontend.vercel.app",
  "https://vidhyatransfer-admin.vercel.app",
  "https://vidhya-transfer.vercel.app"
];

// ✅ CORS config (IMPORTANT)
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// ✅ Apply CORS middleware
app.use(cors(corsOptions));

// ✅ Handle preflight requests PROPERLY
app.options("*", cors(corsOptions));


// ------------------ BODY + MIDDLEWARE ------------------

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Passport middleware
app.use(passport.initialize());


// ------------------ ROUTES ------------------

import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";
import chatRouter from "./routes/chat.routes.js";
import messageRouter from "./routes/message.routes.js";
import requestRouter from "./routes/request.routes.js";
import reportRouter from "./routes/report.routes.js";
import ratingRouter from "./routes/rating.routes.js";
import onboardingRouter from "./routes/onboarding.routes.js";
import skillRouter from "./routes/skill.routes.js";
import postRouter from "./routes/post.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import adminRouter from "./routes/admin.routes.js";
import eventRouter from "./routes/event.routes.js";
import resourceRouter from "./routes/resource.routes.js";
import quizRouter from "./routes/quiz.routes.js";

app.use("/user", userRouter);
app.use("/auth", authRouter);
app.use("/chat", chatRouter);
app.use("/message", messageRouter);
app.use("/request", requestRouter);
app.use("/report", reportRouter);
app.use("/rating", ratingRouter);
app.use("/onboarding", onboardingRouter);
app.use("/skill", skillRouter);
app.use("/post", postRouter);
app.use("/payment", paymentRouter);
app.use("/admin", adminRouter);
app.use("/events", eventRouter);
app.use("/resources", resourceRouter);
app.use("/quiz", quizRouter);

export { app };