import { Router } from "express";
import {
  login,
  register,
  testFunction,
  addStudentDetails,
  getStudentDetails,
  updateStudentDetails,
  changePassword,
  fetchStudentBasicDetails,
} from "../controllers/student.controller";
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

router
  .route("/fetch-student")
  .get(authenticateStudentToken, fetchStudentBasicDetails);
router.route("/get-details").get(authenticateStudentToken, getStudentDetails);

router
  .route("/update-details")
  .post(authenticateStudentToken, updateStudentDetails);
router
  .route("/change-password")
  .patch(authenticateStudentToken, changePassword);

// router.route("/get-assignments").get(getAssignments);

export default router;
