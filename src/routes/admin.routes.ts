import { Router } from "express";
import {
  changePassword,
  loginAdmin,
  registerAdmin,
} from "../controllers/admin.controller";
import { authenticateAdminToken } from "../middleware/admin.middleware";

const router = Router();

router.route("/").get((req, res) => {
  console.log(req);
  res.send("Hello World");
});

router.route("/login").post(loginAdmin);

router.route("/register").post(registerAdmin);

router.route("/change-password").put(authenticateAdminToken, changePassword);

export default router;
