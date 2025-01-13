import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { Student, StudentDetails } from "../models/student.models";
import { LogOutError } from "../utils/utils";

// Utility for sending responses
const sendResponse = (
  res: Response,
  status: number,
  message: string,
  success: boolean,
  data?: object
) => {
  res.status(status).json({ message, success, ...data });
};

// Test function
export const testFunction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    sendResponse(res, 200, "Hello World", true);
  } catch (error) {
    LogOutError(error);
    sendResponse(res, 500, "Internal server error", false, {
      errorMessage: error.message,
    });
  }
};

// Registration handler
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, department, urn, crn, semester, section } = req.body;

    if (
      !name ||
      !email ||
      !department ||
      !urn ||
      !crn ||
      !semester ||
      !section
    ) {
      return sendResponse(res, 400, "All fields are required.", false);
    }

    const existingStudent = await Student.findOne({
      $or: [{ email }, { urn }],
    });
    if (existingStudent) {
      return sendResponse(
        res,
        409,
        "URN or email already exists in the database.",
        false
      );
    }

    const hashedPassword = await bcrypt.hash(urn, 8);
    const newStudent = await Student.create({
      ...req.body,
      password: hashedPassword,
    });

    if (!newStudent) {
      return sendResponse(res, 500, "Failed to register student.", false);
    }

    sendResponse(
      res,
      201,
      `Registration of ${name} is completed successfully.`,
      true
    );
  } catch (error) {
    LogOutError(error);
    sendResponse(res, 500, "Internal server error", false, {
      errorMessage: error.message,
    });
  }
};

// Login handler
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendResponse(res, 400, "Email and password are required.", false);
    }

    const student = await Student.findOne({ email });
    if (!student) {
      return sendResponse(res, 404, "Invalid email or password.", false);
    }

    const isPasswordValid = await bcrypt.compare(password, student.password);
    if (!isPasswordValid) {
      return sendResponse(res, 401, "Invalid email or password.", false);
    }

    const token = jwt.sign(
      { id: student._id, email: student.email, name: student.name },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    sendResponse(res, 200, "Login successful.", true, {
      authToken: token,
      name: student.name,
      userType: "student",
      id: student._id,
    });
  } catch (error) {
    LogOutError(error);
    sendResponse(res, 500, "Internal server error", false, {
      errorMessage: error.message,
    });
  }
};

// Add student details
export const addStudentDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendResponse(
        res,
        401,
        "Unauthorized. No user ID found in token.",
        false
      );
    }

    const student = await Student.findById(userId);
    if (!student) {
      return sendResponse(res, 404, "Student not found.", false);
    }

    const isDetailsFilled = await StudentDetails.findOne({ studentId: userId });
    if (isDetailsFilled) {
      return sendResponse(res, 409, "Details already filled.", false);
    }

    const filledDetails = await StudentDetails.create({
      studentId: student._id,
      studentUrn: student.urn,
      ...req.body,
    });

    if (!filledDetails) {
      return sendResponse(
        res,
        500,
        "Something went wrong while saving the details.",
        false
      );
    }

    student.isDetailsFilled = true;
    await student.save();

    sendResponse(res, 200, "Details added successfully.", true);
  } catch (error) {
    LogOutError(error);
    sendResponse(res, 500, "Internal server error", false, {
      errorMessage: error.message,
    });
  }
};
