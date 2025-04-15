/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import { Error500 } from "../constants";
import { Assignment } from "../models/assignment.models";
import { Course } from "../models/course.models";
import { Faculty } from "../models/faculty.models";
import { Notice } from "../models/notice.models";
import { PYQ } from "../models/pyq.model";
import cloudinary from "../utils/cloudinary.config";
import { LogOutError, sendResponse } from "../utils/utils";

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

    if (!faculty) {
      res.status(404).json({
        message: "Invalid email or password.",
        success: false,
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, faculty.password);
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

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const updatedData = JSON.parse(req.body.faculty);

    // Fetch faculty details once and exclude password field
    const existingFaculty = await Faculty.findById(req.user.id).select(
      "-password"
    );
    if (!existingFaculty) {
      res.status(404).json({ message: "No Faculty found.", success: false });
      return;
    }

    // Create conditions for conflict check only if values have changed
    const conflictConditions = [];
    if (updatedData.empId && updatedData.empId !== existingFaculty.empId) {
      conflictConditions.push({ empId: updatedData.empId });
    }
    if (updatedData.email && updatedData.email !== existingFaculty.email) {
      conflictConditions.push({ email: updatedData.email });
    }

    // Check for conflicts only if there are conditions to check
    if (conflictConditions.length > 0) {
      const conflicts = await Faculty.findOne({ $or: conflictConditions });

      if (conflicts) {
        res.status(409).json({
          message:
            conflicts.empId === updatedData.empId
              ? "Employee ID already exists."
              : "Email already exists.",
          success: false,
        });
        return;
      }
    }

    let result = "";

    // Upload the image to Cloudinary only if it exists
    if ((req as any).file) {
      const uploadResponse = await cloudinary.v2.uploader.upload(
        (req as any).file.path
      );
      result = uploadResponse.secure_url;
    }

    // Update faculty details in a single DB call
    const updatedFaculty = await Faculty.findByIdAndUpdate(
      req.user.id,
      { $set: updatedData },
      { new: true, select: "-password" }
    );

    if (result) {
      updatedFaculty.profileImage = result;
      await updatedFaculty.save();
    }

    res.status(200).json({
      message: "Faculty details updated successfully.",
      success: true,
      data: { updatedProfile: updatedFaculty },
    });
  } catch (error) {
    LogOutError(error);
    res.status(500).json(Error500(error));
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { oldPassword, newPassword } = req.body;

    const faculty = await Faculty.findById(userId);
    if (!faculty) {
      return sendResponse(res, 404, "Faculty not found.", false);
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, faculty.password);
    if (!isPasswordValid) {
      return sendResponse(res, 401, "Invalid old password.", false);
    }

    faculty.password = await bcrypt.hash(newPassword, 8);
    await faculty.save();

    sendResponse(res, 200, "Password changed successfully.", true);
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
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

export const getFacultyProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const faculty = await Faculty.findById(req.user.id).select("-password");

    if (!faculty) {
      sendResponse(res, 404, "Faculty not found.", false);
      return;
    }
    res.status(200).json({
      success: true,
      message: "Faculty profile fetched successfully.",
      data: { profile: faculty },
    });
    return;
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const getNotices = async (req: Request, res: Response) => {
  try {
    const notices = await Notice.find();

    return sendResponse(res, 200, "", true, { notices });
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const publishNotice = async (req: Request, res: Response) => {
  try {
    const facultyId = req.user?.id;
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return sendResponse(res, 404, "Faculty not found.", false);
    }

    const { noticeNumber, noticeSubject, noticeDescription } = req.body;

    const noticeExists = await Notice.findOne({
      noticeNumber,
    });

    if (noticeExists) {
      return sendResponse(res, 409, "Notice already exists.", false);
    }

    if (!(req as any).file) {
      const notice = await Notice.create({
        author: {
          userType: "faculty",
          userId: faculty._id,
          userName: faculty.name,
        },
        noticeNumber,
        noticeSubject,
        noticeDescription,
      });

      if (!notice) {
        return sendResponse(res, 500, "Internal server error.", false);
      }
      return sendResponse(res, 200, "Notice published successfully.", true, {
        notice,
      });
    }

    const result = await cloudinary.v2.uploader.upload(
      (req as any).file.path,
      { resource_type: "raw" } // Cloudinary will automatically detect if it's a PDF
    );

    const notice = await Notice.create({
      author: {
        userType: "admin",
        userId: faculty._id,
        userName: faculty.name,
      },
      noticeNumber,
      noticeSubject,
      noticeDescription,
      pdf: result.secure_url, // Cloudinary provides a secure URL for the uploaded file
    });

    // Remove the file from local storage after uploading
    fs.unlinkSync((req as any).file.path);

    if (!notice) {
      return sendResponse(res, 500, "Internal server error.", false);
    }

    return sendResponse(res, 200, "Notice published successfully.", true, {
      notice,
    });
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const uploadPyq = async (req: Request, res: Response) => {
  try {
    const facultyId = req.user?.id;
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return sendResponse(res, 404, "Faculty not found.", false);
    }

    const { courseCode, examSession, examType } = req.body;

    const course = await Course.findOne({
      courseCode,
    });

    if (!course) {
      // Remove the file.
      fs.unlinkSync((req as any).file.path);

      return sendResponse(
        res,
        404,
        `No course with ${courseCode} found in all the courses.`,
        false
      );
    }

    const pyqExists = await Course.findOne({
      courseCode,
      examSession,
      examType,
    });

    if (pyqExists) {
      // Remove the file
      fs.unlinkSync((req as any).file.path);

      return sendResponse(res, 409, "Specified pyq already exists.", false);
    }

    //upload the file to cloudinary
    const result = await cloudinary.v2.uploader.upload(
      (req as any).file.path,
      { resource_type: "raw" } // Cloudinary will automatically detect if it's a PDF
    );

    // delete the file from the server
    fs.unlinkSync((req as any).file.path);

    const pyq = await PYQ.create({
      course: course._id,
      author: faculty._id,
      examSession,
      examType,
      pdfUrl: result.secure_url,
    });

    if (!pyq) {
      return sendResponse(
        res,
        403,
        "Something went wrong while uploading the pyq.",
        false
      );
    }

    const savedPyq = await PYQ.findById(pyq._id)
      .populate({
        path: "course",
        select: "courseName courseShortName semester",
      })
      .populate({
        path: "author",
        select: "name email",
      });

    return sendResponse(res, 201, "PYQ uploaded successfully.", true, {
      pyq: savedPyq,
    });
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};
