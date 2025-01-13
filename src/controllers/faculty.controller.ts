/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import fs from "fs";
import { Faculty } from "../models/faculty.models";
import { Notice } from "../models/notice.models";
import cloudinary from "../utils/cloudinary.config";
import { Error500 } from "../constants";
import { LogOutError, sendResponse } from "../utils/utils";
import { Assignment } from "../models/assignment.models";

const removeFile = (path: string): void => {
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
};

export const registerFaculty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, empId } = req.body;

    const existingFaculty = await Faculty.findOne({
      $or: [{ empId }, { email }],
    });

    if (existingFaculty) {
      res.status(409).json({
        message: "Email or Employee ID already in database.",
        success: false,
      });
      return;
    }

    const hashPassword = await bcrypt.hash(email, 8);

    console.log(req.body);

    const faculty = await Faculty.create({
      ...req.body,
      password: hashPassword,
    });

    res.status(201).json({
      message: `Registration of ${name} with EmpId ${empId} is successful.`,
      success: true,
      data: faculty,
    });
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const loginFaculty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const faculty = await Faculty.findOne({ email });

    console.log(faculty);

    if (!faculty) {
      res.status(404).json({
        message: "Invalid email or password.",
        success: false,
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, faculty.password);
    console.log(isPasswordValid);
    if (!isPasswordValid) {
      res.status(401).json({
        message: "Invalid email or password.",
        success: false,
      });
      return;
    }

    const token = jwt.sign(
      { id: faculty._id, email: faculty.email, name: faculty.name },
      process.env.JWT_SECRET!,
      { expiresIn: "3d" }
    );

    res.status(200).json({
      message: "Login successful.",
      success: true,
      authToken: token,
      name: faculty.name,
      userType: "faculty",
      id: faculty._id,
    });
  } catch (error) {
    res.status(500).json(Error500(error));
  }
};

export const addNotice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { noticeId } = req.body;

    const isNoticeIdTaken = await Assignment.findOne({
      noticeId,
    });

    if (isNoticeIdTaken) {
      return sendResponse(res, 409, `${noticeId} already exists.`, false);
    }

    const result = await cloudinary.v2.uploader.upload((req as any).file.path, {
      resource_type: "raw",
    });

    const notice = await Notice.create({
      ...req.body,
      author: {
        authorId: req.user.id,
        authorName: req.user.name,
      },
      noticeFile: result.url,
    });

    removeFile((req as any).file.path);

    res.status(201).json({
      message: `Notice with Notice ID ${noticeId} added successfully.`,
      success: true,
      data: notice,
    });
  } catch (error) {
    removeFile((req as any).file.path);
    LogOutError(error);
    res.status(500).json(Error500(error));
  }
};

export const editDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { empId, ...updateFields } = req.body;

    if (!empId) {
      res.status(400).json({
        message: "Employee ID is required to update details.",
        success: false,
      });
      return;
    }

    if (Object.keys(updateFields).length === 0) {
      res.status(400).json({
        message: "No fields provided for updating.",
        success: false,
      });
      return;
    }

    const updatedFaculty = await Faculty.findOneAndUpdate(
      { empId },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedFaculty) {
      res.status(404).json({
        message: "Faculty not found with the given Employee ID.",
        success: false,
      });
      return;
    }

    res.status(200).json({
      message: "Faculty details updated successfully.",
      success: true,
      data: updatedFaculty,
    });
  } catch (error) {
    LogOutError(error);
    res.status(500).json(Error500(error));
  }
};

export const addAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.body;

    const isAssignmentIdTaken = await Assignment.findOne({
      assignmentId,
    });

    if (isAssignmentIdTaken) {
      return sendResponse(res, 409, `${assignmentId} already exists.`, false);
    }

    const result = await cloudinary.v2.uploader.upload((req as any).file.path, {
      resource_type: "raw",
    });

    const notice = await Notice.create({
      ...req.body,
      author: {
        authorId: req.user.id,
        authorName: req.user.name,
      },
      noticeFile: result.url,
    });

    removeFile((req as any).file.path);

    res.status(201).json({
      message: `Notice with Notice ID ${assignmentId} added successfully.`,
      success: true,
      data: notice,
    });
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};
