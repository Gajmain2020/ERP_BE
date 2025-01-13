import mongoose from "mongoose";
import { IStudent } from "../utils/types"; // Reusable required string field

const reqString = {
  required: true,
  type: String,
}; // Student Schema (Basic Info)

const studentSchema = new mongoose.Schema<IStudent>(
  {
    // Ensures unique email and case insensitivity
    crn: String,
    department: reqString,
    email: { ...reqString, lowercase: true, unique: true },
    // Status Flags
    isDetailsFilled: {
      default: false,
      type: Boolean,
    },
    isVerified: {
      default: false,
      type: Boolean,
    },
    name: reqString,
    // Unique Registration Number
    password: reqString,
    section: {
      required: true,
      type: String,
    },
    semester: {
      enum: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"],
      required: true,
      type: String,
    },
    // Teacher Guardian Information
    TG: {
      teacherEmpId: {
        type: String,
        unique: true,
      },
      teacherId: {
        type: String,
        unique: true,
      },
      teacherName: String,
      teacherPhoneNumber: {
        type: String,
        validate: {
          message: "Invalid phone number format.",
          validator: (v) => /^\d{10}$/.test(v),
        },
      },
    },
    urn: { ...reqString, unique: true },
  },
  {
    timestamps: true,
  }
); // Student Details Schema (Comprehensive Info)

const studentDetailsSchema = new mongoose.Schema(
  {
    // Identification Details
    aadharNumber: {
      type: String,
      unique: true,
      validate: {
        // Validates 12-digit Aadhaar number
        message: "Invalid Aadhaar number format.",
        validator: (v) => /^\d{12}$/.test(v),
      },
    },
    // Unique admission number
    abcId: {
      type: String,
    },
    achievements: [
      {
        date: Date,
        description: String,
        title: reqString,
      },
    ],
    // Academic Details
    admissionNumber: { ...reqString, unique: true },
    bloodGroup: {
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
      required: true,
      type: String,
    },
    category: {
      enum: ["GEN", "OBC", "ST", "SC", "EWS"],
      // Includes EWS
      required: true,
      type: String,
    },
    currentAddress: {
      address: String,
      city: String,
      pinCode: {
        required: true,
        type: String,
        validate: {
          // Validates 6-digit PIN code
          message: "Invalid PIN code format.",
          validator: (v) => /^\d{6}$/.test(v),
        },
      },
      state: String,
    },
    // Ensure URN is unique
    // Personal Details
    dob: {
      required: true,
      type: Date,
    },
    emergencyContact: {
      mobileNumber: {
        type: String,
        validate: {
          message: "Invalid mobile number format.",
          validator: (v) => /^\d{10}$/.test(v),
        },
      },
      name: reqString,
      relation: String,
    },
    gender: {
      enum: ["male", "female", "other"],
      required: true,
      type: String,
    },
    // Parent/Guardian Details
    guardianDetails: {
      alternateGuardian: {
        mobileNumber: String,
        name: String,
        relationship: String,
      },
      father: {
        mobileNumber: {
          required: true,
          type: String,
          validate: {
            message: "Invalid mobile number format.",
            validator: (v) => /^\d{10}$/.test(v),
          },
        },
        name: reqString,
      },
      mother: {
        mobileNumber: {
          required: true,
          type: String,
          validate: {
            message: "Invalid mobile number format.",
            validator: (v) => /^\d{10}$/.test(v),
          },
        },
        name: reqString,
      },
    },
    nationality: {
      default: "Indian",
      type: String,
    },
    // Address
    permanentAddress: {
      address: reqString,
      city: reqString,
      pinCode: {
        required: true,
        type: String,
        validate: {
          // Validates 6-digit PIN code
          message: "Invalid PIN code format.",
          validator: (v) => /^\d{6}$/.test(v),
        },
      },
      state: reqString,
    },
    // Additional Fields
    profilePhoto: {
      required: true,
      type: String,
    },
    studentId: {
      ref: "Student",
      // References the Student schema
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
    // Contact Details
    studentMobileNumber: {
      required: true,
      type: String,
      validate: {
        message: "Invalid mobile number format.",
        validator: (v) => /^\d{10}$/.test(v),
      },
    },
    studentUrn: { ...reqString, unique: true },
  },
  {
    timestamps: true,
  }
); // Export models

const Student = mongoose.model("Student", studentSchema);
const StudentDetails = mongoose.model("StudentDetails", studentDetailsSchema);
export { Student, StudentDetails };
