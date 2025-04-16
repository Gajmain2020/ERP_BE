import { Router } from "express";
import { getNotices } from "../controllers/admin.controller";
import {
  changePassword,
  deleteAssignment,
  deletePyq,
  getAssignments,
  getFacultyProfile,
  getFacultyTimetable,
  getPendingAttendanceClass,
  getPyqs,
  getStudents,
  loginFaculty,
  publishNotice,
  registerFaculty,
  saveAttendance,
  updateProfile,
  uploadAssignment,
  uploadPyq,
} from "../controllers/faculty.controller";
import { authenticateFacultyToken } from "../middleware/faculty.middleware";
import upload from "../utils/multer.config";

const router = Router();

router.route("/").get((req, res) => {
  res.send("hello world");
});

router
  .route("/faculty-profile")
  .get(authenticateFacultyToken, getFacultyProfile);

router.route("/register").post(registerFaculty);
router.route("/login").post(loginFaculty);
router
  .route("/update-faculty-profile")
  .patch(authenticateFacultyToken, upload.single("image"), updateProfile);

router
  .route("/change-password")
  .patch(authenticateFacultyToken, changePassword);

// ATTENDANCE RELATED ROUTE
router
  .route("/get-pending-attendance-classes")
  .get(authenticateFacultyToken, getPendingAttendanceClass);

// ASSIGNMENT RELATED ROUTE
router.route("/get-assignments").get(authenticateFacultyToken, getAssignments);
router
  .route("/upload-assignment")
  .post(authenticateFacultyToken, upload.single("pdf"), uploadAssignment);
router
  .route("/delete-assignment")
  .delete(authenticateFacultyToken, deleteAssignment);

// TIMETABLE RELATED ROUTE
router
  .route("/get-timetable")
  .get(authenticateFacultyToken, getFacultyTimetable);

// ATTENDANCE RELATED ROUTE
router.route("/save-attendance").post(authenticateFacultyToken, saveAttendance);

// STUDENTS RELATED ROUTES
router.route("/get-students").get(authenticateFacultyToken, getStudents);

// NOTICE RELATED ROUTE
router.route("/get-notices").get(authenticateFacultyToken, getNotices);
router
  .route("/publish-notice")
  .post(authenticateFacultyToken, upload.single("pdf"), publishNotice);

// PYQ RELATED ROUTE
router
  .route("/upload-pyq")
  .post(authenticateFacultyToken, upload.single("pdf"), uploadPyq);
router.route("/get-pyq").get(authenticateFacultyToken, getPyqs);
router.route("/delete-pyq").delete(authenticateFacultyToken, deletePyq);

export default router;
