import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    password: {
      type: String,
      default: null, // null for Google OAuth users
    },
    picture: {
      type: String,
      default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToK4qEfbnd-RN82wdL2awn_PMviy_pelocqQ",
    },
    rating: {
      type: Number,
      default: 0,
    },
    credits: {
      type: Number,
      default: 0,
    },
    linkedinLink: {
      type: String,
      default: "",
    },
    githubLink: {
      type: String,
      default: "",
    },
    portfolioLink: {
      type: String,
      default: "",
    },
    skillsProficientAt: [
      {
        name: {
          type: String,
          required: true,
        },
        category: {
          type: String,
          default: "General",
        },
        proficiency: {
          type: String,
          enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
          default: "Intermediate",
        },
      },
    ],
    skillsToLearn: [
      {
        name: {
          type: String,
          required: true,
        },
        proficiency: {
          type: String,
          enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
          default: "Beginner",
        },
        autoMatchTutors: {
          type: Boolean,
          default: false,
        },
      },
    ],
    phone: {
      type: String,
      default: "",
    },
    personalInfo: {
      age: {
        type: Number,
        default: null,
      },
      country: {
        type: String,
        default: "",
      },
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    onboardingStep: {
      type: Number,
      default: 0, // 0: Personal Info, 1: Skill Profile, 2: Preferences
    },
    preferences: {
      notifications: {
        type: Boolean,
        default: true,
      },
      autoMatch: {
        type: Boolean,
        default: false,
      },
      availability: {
        type: Number,
        default: 0, // hours per week
      },
      utilization: [{
        type: String,
        enum: ["Instant Help", "Hire Expert", "Events"],
      }],
      rates: {
        mentorship: { type: Number, default: 0 },
        instantHelp: { type: Number, default: 0 },
        freelance: { type: Number, default: 0 }
      },
      skillsInterestedInLearning: [
        {
          type: String,
        },
      ],
    },
    education: [
      {
        institution: {
          type: String,
          default: "",
        },
        degree: {
          type: String,
          default: "",
        },
        startDate: {
          type: Date,
          default: null,
        },
        endDate: {
          type: Date,
          default: null, // or you can leave it undefined
        },
        score: {
          type: Number,
          default: 0,
        },
        description: {
          type: String,
          default: "",
        },
      },
    ],
    bio: {
      type: String,
      default: "",
    },
    tutorialVideo: {
      type: String,
      default: "",
    },
    projects: [
      {
        title: {
          type: String,
          default: "",
        },
        description: {
          type: String,
          default: "",
        },
        projectLink: {
          type: String,
          default: "",
        },
        techStack: [
          {
            type: String,
            default: "",
          },
        ],
        startDate: {
          type: Date,
          default: null,
        },
        endDate: {
          type: Date,
          default: null,
        },
      },
    ],
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    otp: {
      type: String, // Stored as Hash (bcrypt)
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    // Security & Logic Fields
    status: {
      type: String,
      enum: ["active", "banned", "deleted"],
      default: "active",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    // OTP attempt tracking (brute-force protection)
    otpAttempts: {
      type: Number,
      default: 0,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    // ✅ JWT Revocation: Incrementing this number instantly invalidates ALL existing tokens for this user.
    // Used on: logout, ban, password reset, password change.
    tokenVersion: {
      type: Number,
      default: 0,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    termsAccepted: {
      type: Boolean,
      default: false,
    },
    marketingConsent: {
      type: Boolean,
      default: false,
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    profileDecoration: {
      avatarFrame: {
        type: String,
        enum: ["none", "golden-ring", "neon-pulse", "emerald-glow", "ruby-blaze", "ice-crystal", "aurora-borealis"],
        default: "none",
      },
      profileEffect: {
        type: String,
        enum: ["none", "sparkle", "aurora", "fireflies", "matrix-rain"],
        default: "none",
      },
      profileCard: {
        type: String,
        enum: ["default", "gradient-ocean", "dark-cosmos", "sunset-blaze", "forest-mist", "lavender-dream"],
        default: "default",
      },
    },
    dailyQuiz: {
      streak: { type: Number, default: 0 },
      lastAttemptDate: { type: Date, default: null },
      lastGeneratedDate: { type: Date, default: null },
      currentQuestion: {
        type: Object,
        default: null, // { question: "", options: [], correctAnswer: 0 }
      }
    }
  },
  { timestamps: true }
);
// ✅ Fix #7: Indexes for high-traffic query fields
// username: hit on every auth request, profile view, discover
// email: hit on every login, OTP, password reset
// status+lockUntil: hit on every banUser admin action check
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ status: 1, lockUntil: 1 });
userSchema.index({ "skillsProficientAt.name": 1 }); // discover/search queries

export const User = mongoose.model("User", userSchema);
