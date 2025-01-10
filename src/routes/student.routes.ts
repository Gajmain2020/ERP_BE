import { Router } from "express";
import {
  login,
  register,
  testFunction,
} from "../controllers/student.controllers";

const router = Router();

router.route("/").get(testFunction);
router.route("/register").post(register);
router.route("/login").post(login);

export default router;
