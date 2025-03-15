import { Router } from "express";
import {
  registerFaculty,
  loginFaculty,
  addNotice,
  updateProfile,
  addAssignment,
  getFacultyProfile,
  changePassword,
} from "../controllers/faculty.controller";
import upload from "../utils/multer.config";
import { authenticateFacultyToken } from "../middleware/faculty.middleware";
import { addNewCourse } from "../controllers/admin.controller";

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
  .patch(authenticateFacultyToken, updateProfile);

router
  .route("/change-password")
  .patch(authenticateFacultyToken, changePassword);

//adding course
router.route("/add-course").post(authenticateFacultyToken, addNewCourse);

//adding notice
router
  .route("/add-notice")
  .post(upload.single("pdf"), authenticateFacultyToken, addNotice);

// Adding assignment
router
  .route("/add-notice")
  .post(upload.single("pdf"), authenticateFacultyToken, addAssignment);

export default router;
