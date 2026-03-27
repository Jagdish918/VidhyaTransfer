import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import { globalLimiter } from "./middlewares/rateLimiter.middleware.js";
import helmet from "helmet";
import { ApiError } from "./utils/ApiError.js";

const app = express();

// ─── SECURITY HEADERS (Helmet) ────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://*.googleusercontent.com"],
        mediaSrc: ["'self'", "https://res.cloudinary.com", "blob:"],
        connectSrc: ["'self'", "https://*.duckdns.org", "wss://*.duckdns.org", "https://res.cloudinary.com"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "https://vidhya-transfer.vercel.app"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ─── GLOBAL RATE LIMITER (200 req / 15 min per IP) ───────────────────────────
app.use(globalLimiter);

// ─── BODY PARSING ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// ─── PASSPORT ─────────────────────────────────────────────────────────────────
app.use(passport.initialize());

// ─── ROUTES ───────────────────────────────────────────────────────────────────
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
import sessionRouter from "./routes/session.routes.js";

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
app.use("/sessions", sessionRouter);

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: err.errors,
    });
  }

  // Handle unexpected errors (don't leak details in production)
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message;

  return res.status(statusCode).json({
    success: false,
    message,
  });
});

export { app };