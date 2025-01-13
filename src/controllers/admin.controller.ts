import { sendResponse, LogOutError } from "../utils/utils";
import { Course } from "../models/course.models";
import { Request, Response } from "express";

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
