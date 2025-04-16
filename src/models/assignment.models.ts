import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema(
  {
    assignmentNumber: {
      type: Number,
      required: true,
    },
    assignmentName: {
      type: String,
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "course",
      required: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "faculty",
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    assignmentFileUrl: {
      type: String,
      required: true,
    },
    submittedStudents: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
        },
        submittedAt: Date,
        fileUrl: String,
      },
    ],
  },
  { timestamps: true }
);

const Assignments = mongoose.model("assignment", AssignmentSchema);
export { Assignments };
