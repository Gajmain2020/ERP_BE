import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { Admin } from "../models/admin.model";
import { Course } from "../models/course.models";
import { Faculty } from "../models/faculty.models";
import { Student } from "../models/student.models";
import { LogOutError, sendResponse } from "../utils/utils";

export const addNewCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { courseCode } = req.body;

    const courseExisting = await Course.findOne({ courseCode });

    if (courseExisting) {
      return sendResponse(
        res,
        409,
        "Course already exist with given course code.",
        false
      );
    }

    const saveCourse = await Course.create({
      ...req.body,
    });

    if (!saveCourse) {
      return sendResponse(
        res,
        500,
        "Something went wrong please try again.",
        false
      );
    }

    return sendResponse(
      res,
      201,
      `Course ${req.body.courseShortName} successfully added.`,
      true
    );
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || email === "" || password === "") {
      return sendResponse(res, 490, "Invalid credentials.", false);
    }

    const user = await Admin.findOne({
      email,
    });

    if (!user) {
      return sendResponse(res, 404, "Invalid credentials.", false);
    }

    const matchPassword = await bcrypt.compare(password, user.password);

    if (!matchPassword) {
      return sendResponse(res, 403, "Invalid Credentials.", false);
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    sendResponse(res, 200, "Login successful.", true, {
      authToken: token,
      name: user.name,
      userType: "admin",
      id: user._id,
    });
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { email, empId } = req.body;

    const userExists = await Admin.findOne({
      $or: [{ email }, { empId }],
    });

    if (userExists) {
      return sendResponse(
        res,
        409,
        "User already exists in the database.",
        false
      );
    }

    const hashPassword = await bcrypt.hash(email, 8);

    const registerAdmin = await Admin.create({
      ...req.body,
      password: hashPassword,
    });

    if (!registerAdmin) {
      return sendResponse(res, 500, "Internal server error.", false);
    }

    return sendResponse(
      res,
      201,
      `Admin with Employee ID ${empId} registered successfully.`,
      true
    );
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const fetchAllStudents = async (req: Request, res: Response) => {
  try {
    const { department } = req.params;

    const students = await Student.find({ department });

    if (!students) {
      return sendResponse(res, 404, "No students found.", false);
    }

    return sendResponse(
      res,
      200,
      "Students fetched successfully.",
      true,
      students
    );
  } catch (error) {
    LogOutError(error);
    return res.status(500).json({
      message: "Something went wrong. Please try again.",
      success: false,
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { oldPassword, newPassword } = req.body;

    const admin = await Admin.findById(userId);
    if (!admin) {
      return sendResponse(res, 404, "Faculty not found.", false);
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, admin.password);
    if (!isPasswordValid) {
      return sendResponse(res, 401, "Invalid old password.", false);
    }

    admin.password = await bcrypt.hash(newPassword, 8);
    await admin.save();

    sendResponse(res, 200, "Password changed successfully.", true);
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const enrollStudent = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return sendResponse(res, 404, "Admin not found.", false);
    }
    const { department } = admin;

    const student = req.body;

    const studentExists = await Student.findOne({
      $or: [{ email: student.email }, { urn: student.urn }],
    });

    if (studentExists) {
      return sendResponse(
        res,
        409,
        "Student already exists in the database.",
        false
      );
    }

    const hashPassword = await bcrypt.hash(student.email, 8);

    const newStudent = await Student.create({
      ...student,
      department,
      password: hashPassword,
    });

    if (!newStudent) {
      return sendResponse(res, 500, "Internal server error.", false);
    }
    return sendResponse(res, 201, "Student enrolled successfully.", true);
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const enrollFaculty = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return sendResponse(res, 404, "Admin not found.", false);
    }

    const faculty = req.body;

    const facultyExists = await Faculty.findOne({
      $or: [{ email: faculty.email }, { empId: faculty.empId }],
    });

    if (facultyExists) {
      return sendResponse(
        res,
        409,
        "Faculty already exists in the database.",
        false
      );
    }

    const hashPassword = await bcrypt.hash(faculty.email, 8);

    const newFaculty = await Faculty.create({
      ...faculty,
      department: admin.department,
      password: hashPassword,
    });

    if (!newFaculty) {
      return sendResponse(res, 500, "Internal server error.", false);
    }
    return sendResponse(res, 201, "Faculty enrolled successfully.", true);
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const enrollMultipleStudents = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const admin = await Admin.findById(adminId);

    if (!admin || !admin.department) {
      return sendResponse(res, 404, "Admin not found.", false);
    }

    const { students } = req.body;

    if (!students || !students.length) {
      return sendResponse(res, 400, "No students found.", false);
    }

    // Filter out invalid students
    interface StudentData {
      email: string;
      urn: string;
    }

    const validStudents = students.filter((s: StudentData) => s.email && s.urn);
    if (!validStudents.length) {
      return sendResponse(res, 400, "No valid student data found.", false);
    }

    // Fetch existing students based on email or urn
    const existing = await Student.find({
      $or: validStudents.flatMap((s: StudentData) => [
        { email: s.email },
        { urn: s.urn },
      ]),
    });

    const existingEmails = new Set(existing.map((s) => s.email));
    const existingURNs = new Set(existing.map((s) => s.urn));

    // Filter out duplicates
    const newStudents = validStudents.filter(
      (s: StudentData) =>
        !existingEmails.has(s.email) && !existingURNs.has(s.urn)
    );

    const studentDocs = await Promise.all(
      newStudents.map(async (student: StudentData) => {
        const hashPassword = await bcrypt.hash(student.email, 8);
        return {
          ...student,
          department: admin.department,
          password: hashPassword,
        };
      })
    );

    // Bulk insert
    const inserted = await Student.insertMany(studentDocs);

    const addedCount = inserted.length;
    const failedCount = students.length - addedCount;

    return sendResponse(
      res,
      201,
      `${addedCount} successfully enrolled out of ${students.length}, ${failedCount} failed.`,
      true
    );
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};
