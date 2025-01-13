import mongoose from "mongoose";
const reqString = {
  required: true,
  type: String,
};
const facultySchema = new mongoose.Schema(
  {
    bloodGroup: {
      default: "",
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
      type: String,
    },
    department: reqString,
    email: { ...reqString, lowercase: true, unique: true },
    empId: reqString,
    gender: {
      default: "",
      enum: ["male", "female", "other"],
      type: String,
    },
    mobileNumber: {
      required: true,
      type: String,
      validate: {
        message: "Invalid mobile number format.",
        validator: (v) => /^\d{10}$/.test(v),
      },
    },
    name: reqString,
    password: reqString,
    position: reqString,
    profileImage: {
      default: "",
      type: String,
    },
  },
  { timestamps: true }
); // Export models

const Faculty = mongoose.model("faculty", facultySchema);
export { Faculty };
