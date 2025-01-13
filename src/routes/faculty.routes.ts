import { Router } from "express";
import {
  registerFaculty,
  loginFaculty,
  addNotice,
  editDetails,
  addAssignment,
} from "../controllers/faculty.controller";
import upload from "../utils/multer.config";
import { authenticateFacultyToken } from "../middleware/faculty.middleware";
import { addNewCourse } from "../controllers/admin.controller";

const router = Router();

router.route("/").get((req, res) => {
  res.send("hello world");
});

router.route("/register").post(registerFaculty);
router.route("/login").post(loginFaculty);
router.route("/edit-details").patch(editDetails);

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
