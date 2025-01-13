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
      required: true,
      type: String,
    },
    department: reqString,
    email: { ...reqString, lowercase: true, unique: true },
    empId: reqString,
    gender: {
      default: "",
      enum: ["male", "female", "other"],
      required: true,
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

const Faculty = mongoose.model("Faculty", facultySchema);
export { Faculty };
