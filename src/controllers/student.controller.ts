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
      res.status(401).json({
        success: false,
        message: "Invalid Credentials.",
      });
      return;
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
      ...req.body.details,
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

export const fetchStudentBasicDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    console.log(userId);

    const studentDetails = await Student.findById(userId).select("-password");

    if (!studentDetails) {
      return sendResponse(res, 404, "Details not found.", false);
    }

    res.status(200).json({
      success: true,
      data: studentDetails,
    });
  } catch (error) {
    LogOutError(error);
    sendResponse(res, 500, "Internal server error", false, {
      errorMessage: error.message,
    });
  }
};

export const getStudentDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const studentBasicDetails = await Student.findById(userId).select(
      "-password"
    );

    if (!studentBasicDetails) {
      sendResponse(res, 404, "Student not found.", false);
      return;
    }

    const studentDetails = await StudentDetails.findOne({ studentId: userId });

    if (!studentDetails) {
      sendResponse(res, 404, "Details not found.", false);
      return;
    }

    sendResponse(res, 200, "Details fetched successfully.", true, {
      moreDetails: studentDetails,
      basicDetails: studentBasicDetails,
    });
    return;
  } catch (error) {
    LogOutError(error);
    sendResponse(res, 500, "Internal server error", false, {
      errorMessage: error.message,
    });
  }
};

export const updateStudentDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const updateData = req.body;

    console.log(updateData);

    const updatedDetails = await StudentDetails.findOneAndUpdate(
      { studentId: userId },
      updateData,
      { new: true }
    );

    if (!updatedDetails) {
      sendResponse(res, 404, "Student details not found.", false);
      return;
    }
    res.status(200).json({
      message: "Details updated successfully.",
      data: { details: updatedDetails },
    });
    return;
  } catch (error) {
    LogOutError(error);
    sendResponse(res, 500, "Internal server error", false, {
      errorMessage: error.message,
    });
  }
};

export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { oldPassword, newPassword } = req.body;

    const student = await Student.findById(userId);
    if (!student) {
      return sendResponse(res, 404, "Student not found.", false);
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, student.password);
    if (!isPasswordValid) {
      return sendResponse(res, 401, "Invalid old password.", false);
    }

    student.password = await bcrypt.hash(newPassword, 8);
    await student.save();

    sendResponse(res, 200, "Password changed successfully.", true);
  } catch (error) {
    LogOutError(error);
    sendResponse(res, 500, "Internal server error", false, {
      errorMessage: error.message,
    });
  }
};

//get Assignments api
// export const getAssignments = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;

//     const assignments = await Assignment.find({
//       studentId: userId,
//     });
//   } catch (error) {
//     LogOutError(error);
//     sendResponse(res, 500, "Internal server error", false, {
//       errorMessage: error.message,
//     });
//   }
// };

// export const getStudentAttendance = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;
//     const { startDate, endDate } = req.query;

//     const attendance = await Attendance.find({
//       studentId: userId,
//       date: {
//         $gte: startDate,
//         $lte: endDate
//       }
//     });

//     sendResponse(
//       res,
//       200,
//       "Attendance fetched successfully.",
//       true,
//       attendance
//     );
//   } catch (error) {
//     LogOutError(error);
//     sendResponse(res, 500, "Internal server error", false, {
//       errorMessage: error.message,
//     });
//   }
// };

// export const getStudentGrades = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;
//     const { semester } = req.query;

//     const grades = await Grades.find({
//       studentId: userId,
//       semester: semester
//     });

//     sendResponse(
//       res,
//       200,
//       "Grades fetched successfully.",
//       true,
//       grades
//     );
//   } catch (error) {
//     LogOutError(error);
//     sendResponse(res, 500, "Internal server error", false, {
//       errorMessage: error.message,
//     });
//   }
// };

// export const getStudentCourses = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;
//     const { semester } = req.query;

//     const enrolledCourses = await CourseEnrollment.find({
//       studentId: userId,
//       semester: semester
//     }).populate('courseId');

//     sendResponse(
//       res,
//       200,
//       "Enrolled courses fetched successfully.",
//       true,
//       enrolledCourses
//     );
//   } catch (error) {
//     LogOutError(error);
//     sendResponse(res, 500, "Internal server error", false, {
//       errorMessage: error.message,
//     });
//   }
// };

// export const submitAssignment = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;
//     const { assignmentId, submissionContent } = req.body;

//     const submission = await AssignmentSubmission.create({
//       studentId: userId,
//       assignmentId,
//       submissionContent,
//       submittedAt: new Date()
//     });

//     sendResponse(
//       res,
//       200,
//       "Assignment submitted successfully.",
//       true,
//       submission
//     );
//   } catch (error) {
//     LogOutError(error);
//     sendResponse(res, 500, "Internal server error", false, {
//       errorMessage: error.message,
//     });
//   }
// };

// export const getFeeDetails = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;
//     const { semester } = req.query;

//     const feeDetails = await FeeDetails.find({
//       studentId: userId,
//       semester: semester
//     });

//     sendResponse(
//       res,
//       200,
//       "Fee details fetched successfully.",
//       true,
//       feeDetails
//     );
//   } catch (error) {
//     LogOutError(error);
//     sendResponse(res, 500, "Internal server error", false, {
//       errorMessage: error.message,
//     });
//   }
// };
