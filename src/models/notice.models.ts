import mongoose from "mongoose";
import { reqString } from "../utils/utils";
const noticeSchema = new mongoose.Schema(
  {
    author: {
      authorId: reqString,
      authorName: reqString,
    },
    noticeDate: {
      default: () => new Date(),
      type: Date,
    },
    noticeFile: reqString,
    noticeId: { ...reqString, unique: true },
    noticeTarget: {
      default: "general",
      enum: ["faculty", "student", "general"],
      type: String,
    },
    noticeTitle: reqString,
    noticeType: { ...reqString, lowercase: true },
  },
  {
    timestamps: true,
  }
);
const Notice = mongoose.model("notice", noticeSchema);
export { Notice };
