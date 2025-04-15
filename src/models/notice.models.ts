import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    author: {
      userType: { required: true, type: String },
      userId: {
        refPath: "author.userType",
        required: true,
        type: mongoose.Schema.Types.ObjectId,
      },
      userName: { required: true, type: String },
    },
    noticeNumber: { type: String, required: true },
    noticeSubject: { type: String, required: true },
    noticeDescription: { type: String, required: true },
    pdf: String,
  },
  { timestamps: true }
);

const Notice = mongoose.model("Notice", noticeSchema);
export { Notice };
