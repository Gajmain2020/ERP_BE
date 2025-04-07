import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { Admin } from "../models/admin.model";
import { Course } from "../models/course.models";
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
  }
};
