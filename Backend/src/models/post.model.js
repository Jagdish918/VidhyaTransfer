import mongoose, { Schema } from "mongoose";

const postSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    skills: [
      {
        name: String,
        category: String,
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    attachments: [
      {
        type: String, // URLs or Base64 strings
      }
    ],
    comments: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: 500,
        },
        likes: [
          {
            type: Schema.Types.ObjectId,
            ref: "User",
          },
        ],
        replies: [
          {
            user: {
              type: Schema.Types.ObjectId,
              ref: "User",
              required: true,
            },
            content: {
              type: String,
              required: true,
              maxlength: 500,
            },
            likes: [
              {
                type: Schema.Types.ObjectId,
                ref: "User",
              },
            ],
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isModerated: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    reportedCount: {
      type: Number,
      default: 0,
    },
    // ✅ FIX: Track who reported the post to prevent duplicates and enable accurate auto-moderation
    reportedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// ✅ Indexes for high-traffic feed queries
postSchema.index({ isDeleted: 1, isModerated: 1, createdAt: -1 });
postSchema.index({ author: 1 });

export const Post = mongoose.model("Post", postSchema);


