import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { Admin } from "../models/admin.model";
import { Course } from "../models/course.models";
import { Faculty } from "../models/faculty.models";
import { Notice } from "../models/notice.models";
import { Student } from "../models/student.models";
import cloudinary from "../utils/cloudinary.config";
import { LogOutError, sendResponse } from "../utils/utils";

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

    const students = req.body;

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

export const enrollMultipleFaculties = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const admin = await Admin.findById(adminId);

    if (!admin || !admin.department) {
      return sendResponse(res, 404, "Admin not found.", false);
    }

    const faculties = req.body;

    if (!faculties || !faculties.length) {
      return sendResponse(res, 400, "No faculties found.", false);
    }

    interface FacultiesData {
      email: string;
      empId: string;
    }

    // Filter out invalid faculties
    const validFaculties = faculties.filter(
      (s: FacultiesData) => s.email && s.empId
    );
    if (!validFaculties.length) {
      return sendResponse(res, 400, "No valid faculty data found.", false);
    }

    // Fetch existing faculties based on email or urn
    const existing = await Faculty.find({
      $or: validFaculties.flatMap((s: FacultiesData) => [
        { email: s.email },
        { empId: s.empId },
      ]),
    });

    const existingEmails = new Set(existing.map((s) => s.email));
    const existingEmpIds = new Set(existing.map((s) => s.empId));

    // Filter out duplicates
    const newFaculties = validFaculties.filter(
      (s: FacultiesData) =>
        !existingEmails.has(s.email) && !existingEmpIds.has(s.empId)
    );

    const facultyDocs = await Promise.all(
      newFaculties.map(async (faculty: FacultiesData) => {
        const hashPassword = await bcrypt.hash(faculty.email, 8);
        return {
          ...faculty,
          department: admin.department,
          password: hashPassword,
        };
      })
    );

    // Bulk insert
    const inserted = await Faculty.insertMany(facultyDocs);

    const addedCount = inserted.length;
    const failedCount = faculties.length - addedCount;

    return sendResponse(
      res,
      201,
      `${addedCount} successfully enrolled out of ${faculties.length}, ${failedCount} failed.`,
      true
    );
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const addNewCourse = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return sendResponse(res, 404, "Admin not found.", false);
    }

    const course = req.body;

    const courseExists = await Course.findOne({
      $or: [{ courseCode: course.courseCode }],
    });

    if (courseExists) {
      return sendResponse(
        res,
        409,
        "Course already exists in the database.",
        false
      );
    }

    const newCourse = await Course.create({
      ...course,
      department: admin.department,
    });

    if (!newCourse) {
      return sendResponse(res, 500, "Internal server error.", false);
    }
    return sendResponse(res, 201, "Course added successfully.", true);
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return sendResponse(res, 404, "Admin not found.", false);
    }

    const courses = await Course.find({ department: admin.department });

    if (!courses) {
      return sendResponse(res, 404, "No courses found.", false);
    }

    return sendResponse(res, 200, "Courses fetched successfully.", true, {
      courses,
    });
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const getFacultiesByCourse = async (req: Request, res: Response) => {
  try {
    console.log("Hello world");

    const adminId = req.user?.id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return sendResponse(res, 404, "Admin not found.", false);
    }

    const { courseId } = req.query;

    const course = await Course.findById(courseId).populate({
      path: "takenBy.facultyId",
      select: "name email", // Only include name and email
    });

    if (!course) {
      return sendResponse(res, 404, "Course not found.", false);
    }

    const faculties = course.takenBy.map((t) => {
      const faculty = t.facultyId as unknown as {
        _id: string;
        name: string;
        email: string;
      };

      return {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email,
      };
    });

    return sendResponse(res, 200, "Faculties fetched successfully.", true, {
      faculties,
    });
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const getAllFaculties = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return sendResponse(res, 404, "Admin not found.", false);
    }

    const faculties = await Faculty.find({
      department: admin.department,
    }).select("_id name email empId isTG position");

    if (!faculties) {
      return sendResponse(res, 404, "No faculties found.", false);
    }

    return sendResponse(res, 200, "Faculties fetched successfully.", true, {
      faculties,
    });
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const assignCourseToFaculty = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return sendResponse(res, 404, "Admin not found.", false);
    }

    const { courseId, facultyId } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return sendResponse(res, 404, "Course not found.", false);
    }

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return sendResponse(res, 404, "Faculty not found.", false);
    }

    // Check if the faculty is already assigned to the course
    const isAssigned = course.takenBy.some(
      (t) => t.facultyId.toString() === faculty._id.toString()
    );

    if (isAssigned) {
      return sendResponse(
        res,
        409,
        "Faculty already assigned to this course.",
        false
      );
    }

    // Assign the course to the faculty
    course.takenBy.push({ facultyId });

    await course.save();

    return sendResponse(
      res,
      200,
      "Course assigned to faculty successfully.",
      true
    );
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const removeFacultyFromCourse = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return sendResponse(res, 404, "Admin not found.", false);
    }

    const { courseId, facultyId } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return sendResponse(res, 404, "Course not found.", false);
    }

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return sendResponse(res, 404, "Faculty not found.", false);
    }

    // Check if the faculty is already assigned to the course
    const isAssigned = course.takenBy.some(
      (t) => t.facultyId.toString() === faculty._id.toString()
    );

    if (!isAssigned) {
      return sendResponse(
        res,
        409,
        "Faculty is not assigned to this course.",
        false
      );
    }

    // Clean removal using Mongoose's built-in `pull`
    course.takenBy.pull({ facultyId: faculty._id });

    await course.save();

    return sendResponse(
      res,
      200,
      "Faculty removed from course successfully.",
      true
    );
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const assignTg = async (req: Request, res: Response) => {
  try {
    const { facultyId } = req.query;

    const faculty = await Faculty.findById(facultyId);

    if (!faculty) {
      return sendResponse(res, 404, "Faculty not found.", false);
    }

    if (faculty.isTG) {
      return sendResponse(
        res,
        403,
        "Faculty is already assigned as TG.",
        false
      );
    }

    faculty.isTG = true;

    await faculty.save();

    return sendResponse(res, 200, "TG assigned successfully.", true);
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const unassignTg = async (req: Request, res: Response) => {
  try {
    const { facultyId } = req.query;

    const faculty = await Faculty.findById(facultyId);

    if (!faculty) {
      return sendResponse(res, 404, "Faculty not found.", false);
    }

    if (!faculty.isTG) {
      return sendResponse(res, 403, "Faculty is not assigned as TG.", false);
    }

    faculty.isTG = false;

    await faculty.save();

    return sendResponse(res, 200, "TG unassigned successfully.", true);
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const assignStudentsToTG = async (req: Request, res: Response) => {
  try {
    const students: { studentId: string }[] = req.body;
    const tgId = req.query.tgId as string;

    if (!students?.length) {
      return sendResponse(res, 400, "No students found.", false);
    }

    if (!tgId) {
      return sendResponse(res, 400, "Faculty ID is required.", false);
    }

    const faculty = await Faculty.findOne({ isTG: true, _id: tgId });
    if (!faculty) {
      return sendResponse(res, 404, "Faculty not found.", false);
    }

    const foundStudents = await Student.find({ _id: { $in: students } });

    if (!foundStudents.length) {
      return sendResponse(res, 404, "No valid students found.", false);
    }

    await Promise.all(
      foundStudents.map((student) => {
        student.TG = {
          facultyId: faculty._id.toString(),
          facultyName: faculty.name,
        };
        return student.save();
      })
    );

    return sendResponse(
      res,
      200,
      `${foundStudents.length} students assigned to TG successfully.`,
      true
    );
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const assignStudentToTG = async (req: Request, res: Response) => {
  try {
    const { tgId, studentId } = req.query;

    if (!tgId || !studentId) {
      return sendResponse(
        res,
        400,
        "TG ID and Student ID are required.",
        false
      );
    }
    const faculty = await Faculty.findOne({ isTG: true, _id: tgId });
    if (!faculty) {
      return sendResponse(res, 404, "Faculty not found.", false);
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return sendResponse(res, 404, "Student not found.", false);
    }

    student.TG = {
      facultyId: faculty._id.toString(),
      facultyName: faculty.name,
    };

    await student.save();

    return sendResponse(res, 200, "Student assigned to TG successfully.", true);
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const searchStudent = async (req: Request, res: Response) => {
  try {
    const { searchString, semester, section } = req.query;

    // Build dynamic filter
    const filter: any = {};

    if (searchString && searchString !== "") {
      filter.$or = [
        { name: { $regex: searchString, $options: "i" } },
        { urn: { $regex: searchString, $options: "i" } },
        { email: { $regex: searchString, $options: "i" } },
      ];
    }

    if (semester && semester !== "") {
      filter.semester = semester;
    }

    if (section && section !== "") {
      filter.section = section;
    }

    const students = await Student.find(filter).select(
      "_id name urn crn section email TG"
    );

    if (!students || students.length === 0) {
      return sendResponse(res, 404, "No students found.", false);
    }

    return sendResponse(res, 200, "Students fetched successfully.", true, {
      students,
    });
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const getTg = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return sendResponse(res, 404, "Admin not found.", false);
    }

    const tg = await Faculty.find({
      department: admin.department,
      isTG: true,
    }).select("_id name email position ");

    if (!tg) {
      return sendResponse(res, 404, "No TG found.", false);
    }

    return sendResponse(res, 200, "TG fetched successfully.", true, {
      tg,
    });
  } catch (error) {
    LogOutError(error);
    return sendResponse(res, 500, "Internal server error.", false);
  }
};

export const publishNotice = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return sendResponse(res, 404, "Admin not found.", false);
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
          userType: "admin",
          userId: admin._id,
          userName: admin.name,
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
        userId: admin._id,
        userName: admin.name,
      },
      noticeNumber,
      noticeSubject,
      noticeDescription,
      pdf: result.secure_url, // Cloudinary provides a secure URL for the uploaded file
    });

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

export const getNotices = async (req: Request, res: Response) => {
  try {
    const notices = await Notice.find()
      .sort({ createdAt: -1 })
      .select("_id noticeNumber pdf author createdAt");

    return sendResponse(res, 200, "", true, { notices });
  } catch (error) {
    LogOutError(error);
  }
};
