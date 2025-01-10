import mongoose from "mongoose";
import { IStudent } from "../utils/types";

// Reusable required string field
const reqString = { type: String, required: true };

// Student Schema (Basic Info)
const studentSchema = new mongoose.Schema<IStudent>(
  {
    name: reqString,
    department: reqString,
    email: { ...reqString, lowercase: true, unique: true }, // Ensures unique email and case insensitivity
    crn: String,
    urn: { ...reqString, unique: true }, // Unique Registration Number
    password: reqString,
    semester: {
      type: String,
      enum: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"],
      required: true,
    },
    section: { type: String, required: true },

    // Status Flags
    isDetailsFilled: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    // Teacher Guardian Information
    TG: {
      teacherName: String,
      teacherId: { type: String, unique: true },
      teacherPhoneNumber: {
        type: String,
        validate: {
          validator: (v) => /^\d{10}$/.test(v),
          message: "Invalid phone number format.",
        },
      },
      teacherEmpId: { type: String, unique: true },
    },
  },
  { timestamps: true }
);

// Student Details Schema (Comprehensive Info)
const studentDetailsSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student", // References the Student schema
      required: true,
    },
    studentUrn: { ...reqString, unique: true }, // Ensure URN is unique

    // Personal Details
    dob: { type: Date, required: true },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    nationality: { type: String, default: "Indian" },

    // Contact Details
    studentMobileNumber: {
      type: String,
      validate: {
        validator: (v) => /^\d{10}$/.test(v),
        message: "Invalid mobile number format.",
      },
      required: true,
    },

    // Parent/Guardian Details
    guardianDetails: {
      mother: {
        name: reqString,
        mobileNumber: {
          type: String,
          validate: {
            validator: (v) => /^\d{10}$/.test(v),
            message: "Invalid mobile number format.",
          },
          required: true,
        },
      },
      father: {
        name: reqString,
        mobileNumber: {
          type: String,
          validate: {
            validator: (v) => /^\d{10}$/.test(v),
            message: "Invalid mobile number format.",
          },
          required: true,
        },
      },
      alternateGuardian: {
        name: String,
        relationship: String,
        mobileNumber: String,
      },
    },

    // Identification Details
    aadharNumber: {
      type: String,
      unique: true,
      validate: {
        validator: (v) => /^\d{12}$/.test(v), // Validates 12-digit Aadhaar number
        message: "Invalid Aadhaar number format.",
      },
    },
    category: {
      type: String,
      enum: ["GEN", "OBC", "ST", "SC", "EWS"], // Includes EWS
      required: true,
    },

    // Address
    permanentAddress: {
      address: reqString,
      city: reqString,
      state: reqString,
      pinCode: {
        type: String,
        validate: {
          validator: (v) => /^\d{6}$/.test(v), // Validates 6-digit PIN code
          message: "Invalid PIN code format.",
        },
        required: true,
      },
    },
    currentAddress: {
      address: String,
      city: String,
      state: String,
      pinCode: {
        type: String,
        validate: {
          validator: (v) => /^\d{6}$/.test(v), // Validates 6-digit PIN code
          message: "Invalid PIN code format.",
        },
        required: true,
      },
    },

    // Academic Details
    admissionNumber: { ...reqString, unique: true }, // Unique admission number
    abcId: { type: String },

    // Additional Fields
    profilePhoto: { type: String, required: true },
    emergencyContact: {
      name: reqString,
      relation: String,
      mobileNumber: {
        type: String,
        validate: {
          validator: (v) => /^\d{10}$/.test(v),
          message: "Invalid mobile number format.",
        },
      },
    },
    achievements: [
      {
        title: reqString,
        description: String,
        date: Date,
      },
    ],
  },
  { timestamps: true }
);

// Export models
const Student = mongoose.model("Student", studentSchema);
const StudentDetails = mongoose.model("StudentDetails", studentDetailsSchema);

export { Student, StudentDetails };
