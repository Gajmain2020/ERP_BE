/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import fs from "fs";
import { Faculty } from "../models/faculty.models";
import { Error500, LogOutError } from "../constants";
import { Notice } from "../models/notice.models";
import cloudinary from "../utils/cloudinary.config";

export const registerFaculty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, department, empId, mobileNumber } = req.body;

    // Validate required fields
    if (!name || !email || !department || !empId || !mobileNumber) {
      res.status(400).json({
        message: "All fields are required.",
        success: false,
      });
      return;
    }
    const checkFacultyExisting = await Faculty.findOne({
      $or: [{ empId }, { email }],
    });

    if (checkFacultyExisting) {
      res.status(409).json({
        message: "Email or Employee ID already in database.",
        success: false,
      });
      return;
    }

    const hashPassword = await bcrypt.hash(email, 8);

    const registerFaculty = await Faculty.create({
      ...req.body,
      password: hashPassword,
    });

    if (!registerFaculty) {
      res.status(500).json({
        message: "Something went wrong. Please try again.",
        success: false,
      });
    }

    res.status(201).json({
      message: `Registration of ${name} with EmpId ${empId} is successful.`,
      success: true,
    });
  } catch (error) {
    LogOutError(error);
    res.status(500).json(Error500(error));
  }
};

export const loginFaculty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password || email === "" || password === "")
      res.status(400).json({
        message: "Please provide credentials.",
        success: false,
      });

    const faculty = await Faculty.findOne({
      email,
    });

    if (!faculty) {
      res
        .status(404)
        .json({ message: "Invalid email or password.", success: false });

      return;
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: faculty._id, email: faculty.email, name: faculty.name },
      process.env.JWT_SECRET,
      { expiresIn: "3d" } // Token expires in 3 days
    );

    // Respond with success and token
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
    const { author, noticeId, noticeTarget, noticeTitle, noticeType } =
      req.body;

    if (!author || !noticeId || !noticeTarget || !noticeTitle || !noticeType) {
      res
        .status(400)
        .json({ message: "All fields are required.", success: false });
      return;
    }

    // Upload the pdf to Cloudinary
    const result = await cloudinary.v2.uploader.upload(
      (req as any).file.path,
      { resource_type: "raw" } // Cloudinary will automatically detect if it's a PDF
    );
    const noticeSaved = await Notice.create({
      ...req.body,
      noticeFile: result.url,
    });

    if (!noticeSaved) {
      fs.unlinkSync((req as any).file.path);
      res.status(500).json({
        message: "Something went wrong. Please try again.",
        success: false,
      });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fs.unlinkSync((req as any).file.path);

    res.status(201).json({
      message: `Notice with Notice ID ${noticeId} added successfully.`,
      success: true,
    });
  } catch (error) {
    fs.unlinkSync((req as any).file.path);
    LogOutError(error);
    res.status(500).json(Error500(error));
  }
};
