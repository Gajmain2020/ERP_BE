import { Router } from "express";
import {
  registerFaculty,
  loginFaculty,
  addNotice,
} from "../controllers/faculty.controller";
import upload from "../utils/multer.config";
import { authenticateFacultyToken } from "../middleware/faculty.middleware";

const router = Router();

router.route("/").get((req, res) => {
  res.send("hello world");
});

router.route("/register").post(registerFaculty);
router.route("/login").post(loginFaculty);

//adding notice
router
  .route("/add-notice")
  .post(upload.single("pdf"), authenticateFacultyToken, addNotice);

export default router;
