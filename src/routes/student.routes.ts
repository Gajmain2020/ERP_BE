import { Router } from "express";
import {
  login,
  register,
  testFunction,
  addStudentDetails,
} from "../controllers/student.controllers";
import {
  authenticateStudentToken,
  checkAllAttributesToAddDetails,
} from "../middleware/student.middleware";

const router = Router();

router.route("/").get(testFunction);
router.route("/register").post(register);
router.route("/login").post(login);
router
  .route("/add-details")
  .post(
    authenticateStudentToken,
    checkAllAttributesToAddDetails,
    addStudentDetails
  );

export default router;
