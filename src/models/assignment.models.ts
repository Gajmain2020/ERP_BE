import mongoose from "mongoose";
import { reqString } from "../utils/utils";

const assignmentSchema = new mongoose.Schema(
  {
    assignmentId: { ...reqString, unique: true },
    author: {
      authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "faculty",
        required: true,
      },
      authorName: reqString,
    },
    assignmentTitle: reqString,
    semester: {
      ...reqString,
      enum: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"],
    },
    section: reqString,
    course: {
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "course",
        require: true,
      },
      courseShoutName: reqString,
    },
    submissions: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "student",
          required: true,
        },
        studentName: String,
        submittedAt: { type: Date, required: true },
        fileUrl: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const Assignment = mongoose.model("assignment", assignmentSchema);

export { Assignment };
