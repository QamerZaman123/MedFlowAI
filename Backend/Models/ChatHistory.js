import mongoose from "mongoose";

const sourceCitationSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      default: "",
    },
    documentName: {
      type: String,
      default: "",
    },
    page: {
      type: Number,
      default: 1,
    },
    section: {
      type: String,
      default: "General",
    },
  },
  { _id: false }
);

const chatHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
    },
    sources: {
      type: [sourceCitationSchema],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);

export default ChatHistory;
