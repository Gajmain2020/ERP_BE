import mongoose from "mongoose";

const pyqSchema = new mongoose.Schema(
  {
    examSession: {
      type: String,
      required: true,
    },
    pdfUrl: {
      type: String,
      required: true,
    },
    examType: {
      type: String,
      enum: ["Regular", "Backlog"],
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "course",
      required: true,
    },
  },
  { timestamps: true }
);

const PYQ = mongoose.model("pyq", pyqSchema);
export { PYQ };
