import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "course",
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "faculty",
      required: true,
    },
    department: { type: String, required: true },
    semester: {
      type: String,
      enum: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"],
      required: true,
    },
    section: { type: String, required: true }, // e.g., A, B
    date: { type: Date, required: true }, // Date of the class
    periodNumber: { type: Number, required: true }, // 1 to 7
    students: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "student",
          required: true,
        },
        status: {
          type: String,
          enum: ["Present", "Absent", "Leave", "BOA"],
          default: "Present",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Attendance = mongoose.model("attendance", attendanceSchema);
export { Attendance };
