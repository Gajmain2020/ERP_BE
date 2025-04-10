import { Router } from "express";
import {
  addNewCourse,
  assignCourseToFaculty,
  assignStudentToTG,
  assignTg,
  changePassword,
  enrollFaculty,
  enrollMultipleFaculties,
  enrollMultipleStudents,
  enrollStudent,
  getAllCourses,
  getAllFaculties,
  getFacultiesByCourse,
  getTg,
  loginAdmin,
  registerAdmin,
  removeFacultyFromCourse,
  searchStudent,
  unassignTg,
} from "../controllers/admin.controller";
import { authenticateAdminToken } from "../middleware/admin.middleware";

const router = Router();

router.route("/").get((req, res) => {
  console.log(req);
  res.send("Hello World");
});

// Admin Related Routes
router.route("/login").post(loginAdmin);
router.route("/register").post(registerAdmin);
router.route("/change-password").put(authenticateAdminToken, changePassword);

// Student Related Routes
router.route("/enroll-student").post(authenticateAdminToken, enrollStudent);
router
  .route("/enroll-multiple-students")
  .post(authenticateAdminToken, enrollMultipleStudents);
router.route("/search-student").get(authenticateAdminToken, searchStudent);

// Faculty Related Routes
router.route("/enroll-faculty").post(authenticateAdminToken, enrollFaculty);
router
  .route("/enroll-multiple-faculties")
  .post(authenticateAdminToken, enrollMultipleFaculties);

// Course Related Routes
router.route("/add-course").post(authenticateAdminToken, addNewCourse);
router.route("/get-courses").get(authenticateAdminToken, getAllCourses);
router
  .route("/get-faculty-by-course")
  .get(authenticateAdminToken, getFacultiesByCourse);
router.route("/get-faculties").get(authenticateAdminToken, getAllFaculties);
router
  .route("/assign-teacher-to-course")
  .put(authenticateAdminToken, assignCourseToFaculty);
router
  .route("/remove-faculty-from-course")
  .put(authenticateAdminToken, removeFacultyFromCourse);

// TG Related Router
router.route("/assign-tg").put(authenticateAdminToken, assignTg);
router.route("/unassign-tg").put(authenticateAdminToken, unassignTg);
router
  .route("/assign-student-to-tg")
  .put(authenticateAdminToken, assignStudentToTG);
router.route("/get-tg").get(authenticateAdminToken, getTg);

export default router;
