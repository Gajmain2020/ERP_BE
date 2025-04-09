import { Router } from "express";
import {
  addNewCourse,
  assignCourseToFaculty,
  changePassword,
  enrollFaculty,
  enrollMultipleFaculties,
  enrollMultipleStudents,
  enrollStudent,
  getAllCourses,
  getAllFaculties,
  getFacultiesByCourse,
  loginAdmin,
  registerAdmin,
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
  .route("assign-teacher-to-course")
  .put(authenticateAdminToken, assignCourseToFaculty);

export default router;
