import { Router } from "express";
import { addNewCourse, getNotices } from "../controllers/admin.controller";
import {
  changePassword,
  getFacultyProfile,
  loginFaculty,
  publishNotice,
  registerFaculty,
  updateProfile,
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

// NOTICE RELATED ROUTE
router.route("/get-notices").get(authenticateFacultyToken, getNotices);
router
  .route("/publish-notice")
  .post(authenticateFacultyToken, upload.single("pdf"), publishNotice);

export default router;
