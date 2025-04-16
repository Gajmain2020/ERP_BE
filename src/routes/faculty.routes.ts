import { Router } from "express";
import { addNewCourse, getNotices } from "../controllers/admin.controller";
import {
  changePassword,
  deletePyq,
  getAssignments,
  getFacultyProfile,
  getFacultyTimetable,
  getPyqs,
  loginFaculty,
  publishNotice,
  registerFaculty,
  updateProfile,
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

//adding course
router.route("/add-course").post(authenticateFacultyToken, addNewCourse);

// ASSIGNMENT RELATED ROUTE
router.route("/get-assignments").get(authenticateFacultyToken, getAssignments);

// TIMETABLE RELATED ROUTE
router
  .route("/get-timetable")
  .get(authenticateFacultyToken, getFacultyTimetable);

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
