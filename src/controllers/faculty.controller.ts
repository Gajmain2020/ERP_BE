/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import { Error500 } from "../constants";
import { Assignments } from "../models/assignment.models";
import { Attendance } from "../models/attendance.model";
import { Course } from "../models/course.models";
import { Faculty } from "../models/faculty.models";
import { Notice } from "../models/notice.models";
import { PYQ } from "../models/pyq.model";
import { Student } from "../models/student.models";
import { Timetable } from "../models/timetable.model";
import cloudinary from "../utils/cloudinary.config";
import { LogOutError, sendResponse } from "../utils/utils";

//Utility function for attendance
function getLast5WorkingDays() {
  const dates = [];
  const current = new Date();
  while (dates.length < 5) {
    const day = current.getDay(); // 0 = Sunday, 6 = Saturday
    if (day !== 0) {
      // ignore Sundays
      dates.push(new Date(current)); // add clone
    }
    current.setDate(current.getDate() - 1);
  }
  return dates.reverse(); // to keep chronological order
}

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

export const getPyqs = async (req: Request, res: Response) => {
  try {
    const facultyId = req.user?.id;

    if (!facultyId) {
      return sendResponse(
        res,
        404,
        "Faculty with the given token not found.",
        false
      );
    }

    const savedPyq = await PYQ.find({ author: facultyId })
      .populate({
        path: "course",
        select: "courseName courseShortName semester",
      })
      .populate({
        path: "author",
        select: "name email",
      });

    return sendResponse(res, 200, "", true, { pyqs: savedPyq });
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal Server Error.", false);
  }
};

export const deletePyq = async (req: Request, res: Response) => {
  try {
    const facultyId = req.user?.id;
    const pyqId = req.query.pyqId;

    const deleted = await PYQ.findOneAndDelete({
      _id: pyqId,
      author: facultyId,
    });

    if (!deleted) {
      return sendResponse(res, 404, "PYQ is not posted by you.", false);
    }

    return sendResponse(res, 200, "PYQ deleted successfully.", true);
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal Server Error.", false);
  }
};

export const getFacultyTimetable = async (req: Request, res: Response) => {
  try {
    const facultyId = req.user?.id;

    const timetables = await Timetable.find({})
      .populate("week.periods.course", "courseName courseCode semester")
      .populate("week.periods.faculty", "_id")
      .lean(); // ensures returned documents are plain JS objects

    const facultyPeriods: {
      day: string;
      periodNumber: number;
      courseName: string;
      courseCode: string;
      semester: string;
      section: string;
    }[] = [];

    for (const timetable of timetables) {
      for (const day of timetable.week) {
        for (const period of day.periods) {
          const faculty = { _id: (period.faculty as any)._id.toString() };
          if (faculty && faculty._id.toString() === facultyId) {
            const course = period.course as unknown as {
              courseName: string;
              courseCode: string;
              semester: string;
            };

            facultyPeriods.push({
              day: day.day,
              periodNumber: period.periodNumber,
              courseName: course.courseName,
              courseCode: course.courseCode,
              semester: course.semester,
              section: timetable.section,
            });
          }
        }
      }
    }

    return sendResponse(
      res,
      200,
      "Faculty timetable fetched successfully.",
      true,
      { periods: facultyPeriods }
    );
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal Server Error.", false);
  }
};

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const facultyId = req.user?.id;

    const assignments = await Assignments.find({ facultyId })
      .populate({
        path: "courseId",
        select: "courseName courseCode courseShortName",
      })
      .sort({ createdAt: -1 })
      .lean(); // 👈 makes it plain JS object, no need for TS Document inference

    const response = assignments.map((a) => {
      const course = a.courseId as unknown as {
        courseName: string;
        courseCode: string;
        courseShortName: string;
      };

      return {
        _id: a._id,
        assignmentNumber: a.assignmentNumber,
        assignmentName: a.assignmentName,
        dueDate: a.dueDate,
        assignmentFileUrl: a.assignmentFileUrl,
        submittedStudentsCount: a.submittedStudents.length,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        course: {
          courseName: course.courseName,
          courseCode: course.courseCode,
          courseShortName: course.courseShortName,
        },
      };
    });

    return sendResponse(res, 200, "", true, { assignments: response });
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal Server Error.", false);
  }
};

export const uploadAssignment = async (req: Request, res: Response) => {
  try {
    const facultyId = req.user?.id;
    const faculty = await Faculty.findById(facultyId);

    if (!faculty) {
      return sendResponse(res, 404, "Faculty not found.", false);
    }

    const { courseCode, assignmentNumber, assignmentName, dueDate } = req.body;

    const course = await Course.findOne({ courseCode });

    if (!course) {
      fs.unlinkSync((req as any).file.path);
      return sendResponse(
        res,
        404,
        `No course with code ${courseCode} found.`,
        false
      );
    }

    // Check for duplicate assignment
    const assignmentExists = await Assignments.findOne({
      courseId: course._id,
      assignmentNumber,
    });

    if (assignmentExists) {
      fs.unlinkSync((req as any).file.path);
      return sendResponse(res, 409, "Assignment already exists.", false);
    }

    // Upload file to Cloudinary
    const result = await cloudinary.v2.uploader.upload((req as any).file.path, {
      resource_type: "raw",
    });

    fs.unlinkSync((req as any).file.path); // Clean up local file

    // Create assignment
    const assignment = await Assignments.create({
      courseId: course._id,
      facultyId: faculty._id,
      assignmentNumber,
      assignmentName,
      dueDate,
      assignmentFileUrl: result.secure_url,
    });

    const populatedAssignment = await Assignments.findById(assignment._id)
      .populate({
        path: "courseId",
        select: "courseName courseShortName courseCode semester section",
      })
      .populate({
        path: "facultyId",
        select: "name email",
      });

    return sendResponse(res, 201, "Assignment uploaded successfully.", true, {
      assignment: populatedAssignment,
    });
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const facultyId = req.user?.id;
    const assignmentId = req.query.assignmentId;

    const deleted = await Assignments.findOneAndDelete({
      _id: assignmentId,
      facultyId,
    });

    if (!deleted) {
      return sendResponse(
        res,
        404,
        "Assignment not found or not posted by you.",
        false
      );
    }

    return sendResponse(res, 200, "Assignment deleted successfully.", true);
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal Server Error.", false);
  }
};

export const getPendingAttendanceClass = async (
  req: Request,
  res: Response
) => {
  try {
    const facultyId = req.user?.id;
    const last5Days = getLast5WorkingDays(); // Function already available
    const dateStrings = last5Days.map(
      (date) => date.toISOString().split("T")[0]
    );

    const timetables = await Timetable.find({
      "week.periods.faculty": facultyId,
    });

    const missingAttendance = [];

    for (const timetable of timetables) {
      for (const dayObj of timetable.week) {
        for (const period of dayObj.periods) {
          if (String(period.faculty) !== facultyId) continue;

          for (const dateStr of dateStrings) {
            const date = new Date(dateStr);
            const weekday = date.toLocaleDateString("en-US", {
              weekday: "long",
            });

            if (dayObj.day !== weekday) continue;

            const attendanceExists = await Attendance.findOne({
              date: dateStr,
              course: period.course,
              periodNumber: period.periodNumber,
              faculty: facultyId,
            });

            if (!attendanceExists) {
              // Populate the course manually here
              const populatedCourse = await Course.findById(period.course);

              if (!populatedCourse) continue;

              missingAttendance.push({
                date: dateStr,
                day: dayObj.day,
                periodNumber: period.periodNumber,
                course: {
                  _id: populatedCourse._id,
                  courseName: populatedCourse.courseName,
                  courseCode: populatedCourse.courseCode,
                  courseShortName: populatedCourse.courseShortName,
                },
                section: timetable.section,
                department: timetable.department,
                semester: timetable.semester,
              });
            }
          }
        }
      }
    }

    return sendResponse(res, 200, "", true, {
      pendingAttendance: missingAttendance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};

export async function getStudents(req: Request, res: Response) {
  try {
    const { department, semester, section } = req.query;

    // Build dynamic filter object
    const filter: Record<string, any> = {};
    if (department) filter.department = department;
    if (semester) filter.semester = semester;
    if (section) filter.section = section;

    const students = await Student.find(filter).select("name rollNumber _id");

    return sendResponse(res, 200, "", true, { students });
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
}

export async function saveAttendance(req: Request, res: Response) {
  try {
    const {
      courseId,
      department,
      semester,
      section,
      date,
      periodNumber,
      presentStudentIds,
    } = req.body;

    const facultyId = req.user?.id;

    // Fetch all students of the class
    const allStudents = await Student.find({ department, semester, section });

    const attendanceList = allStudents.map((student) => ({
      student: student._id,
      status: presentStudentIds.includes(student._id.toString())
        ? "Present"
        : "Absent",
    }));

    await Attendance.create({
      course: courseId,
      department,
      semester,
      section,
      date,
      periodNumber,
      students: attendanceList,
      faculty: facultyId,
    });

    res.status(200).json({ success: true, message: "Attendance saved" });
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
}
