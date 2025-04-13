import mongoose from "mongoose";

const periodSchema = new mongoose.Schema({
  periodNumber: { type: Number, required: true }, // 1 to 7
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
});

const daySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    required: true,
  },
  periods: [periodSchema], // 7 periods
});

const timetableSchema = new mongoose.Schema({
  semester: {
    type: String,
    enum: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"],
    required: true,
  },
  section: { type: String, required: true }, // Example: A, B, etc.
  department: { type: String, required: true },
  week: [daySchema], // 6 working days, each with 7 periods
});

const Timetable = mongoose.model("timetable", timetableSchema);
export { Timetable };
