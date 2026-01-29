import mongoose, { Schema } from "mongoose";

const unRegisteredUserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    password: {
      type: String,
      default: null, // null for Google OAuth users
    },
    picture: {
      type: String,
      default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToK4qEfbnd-RN82wdL2awn_PMviy_pelocqQ",
    },
    username: {
      type: String,
      default: "",
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
      mode: {
        type: String,
        enum: ["Online", "Instant Help", "Events"],
        default: "Online",
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
  },
  { timestamps: true }
);

export const UnRegisteredUser = mongoose.model("UnRegisteredUser", unRegisteredUserSchema);
