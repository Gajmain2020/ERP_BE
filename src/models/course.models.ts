import mongoose from "mongoose";
import { reqString } from "../utils/utils";
const courseSchema = new mongoose.Schema(
  {
    courseCode: { ...reqString, unique: true },
    courseName: reqString,
    courseShortName: reqString,
    courseType: { ...reqString, enum: ["fe", "core", "prof"] },
    department: reqString,
    semester: {
      ...reqString,
      enum: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"],
    },
    takenBy: [
      {
        facultyId: {
          ref: "faculty",
          type: mongoose.Schema.Types.ObjectId,
        },
        facultyName: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);
const Course = mongoose.model("course", courseSchema);
export { Course };
