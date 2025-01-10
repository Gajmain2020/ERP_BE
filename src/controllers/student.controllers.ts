import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { Student } from "../models/student.models";

// Utility function for consistent error logging
function ERROR(error: Error) {
  console.error(`
  #################################################################
  ERROR MESSAGE: ${error.message}
  ***************************************************************
  ERROR DETAILS: ${JSON.stringify(error, null, 2)}
  #################################################################
  `);
}

// Test function
export const testFunction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    res.status(200).json({ message: "Hello World", success: true });
  } catch (error) {
    ERROR(error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
      errorMessage: error.message,
    });
  }
};

// Registration handler
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, department, urn, crn, semester, section } = req.body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !department ||
      !urn ||
      !crn ||
      !semester ||
      !section
    ) {
      res.status(400).json({
        message: "All fields are required.",
        success: false,
      });
      return;
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({
      $or: [{ name }, { urn }],
    });

    if (existingStudent) {
      res.status(409).json({
        message: "URN or email already exists in the database.",
        success: false,
      });
      return;
    }

    // Hash the URN as the password
    const hashedPassword = await bcrypt.hash(urn, 8);

    // Save student details to the database
    const newStudent = await Student.create({
      ...req.body,
      password: hashedPassword,
    });

    if (!newStudent) {
      res.status(500).json({
        message: "Failed to register student.",
        success: false,
      });
      return;
    }

    // Respond with success
    res.status(201).json({
      message: `Registration of ${name} is completed successfully.`,
      success: true,
    });
  } catch (error) {
    ERROR(error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
      errorMessage: error.message,
    });
  }
};

// Login handler with JWT implementation
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        message: "Email and password are required.",
        success: false,
      });
      return;
    }

    // Check if the student exists
    const student = await Student.findOne({ email });
    if (!student) {
      res.status(404).json({
        message: "Invalid email or password.",
        success: false,
      });
      return;
    }

    // Compare provided password with hashed password
    const isPasswordValid = await bcrypt.compare(password, student.password);
    if (!isPasswordValid) {
      res.status(401).json({
        message: "Invalid email or password.",
        success: false,
      });
      return;
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: student._id, email: student.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "3d" } // Token expires in 3 days
    );

    // Respond with success and token
    res.status(200).json({
      message: "Login successful.",
      success: true,
      authToken: token,
      name: student.name,
      userType: "student",
      id: student._id,
    });
  } catch (error) {
    ERROR(error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
      errorMessage: error.message,
    });
  }
};