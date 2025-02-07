import { Router } from "express";
import {
  login,
  register,
  testFunction,
  addStudentDetails,
  getStudentDetails,
  updateStudentDetails,
  changePassword,
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

router.route("/get-details").get(authenticateStudentToken, getStudentDetails);
router
  .route("/update-details")
  .patch(authenticateStudentToken, updateStudentDetails);
router
  .route("/change-password")
  .patch(authenticateStudentToken, changePassword);

export default router;
