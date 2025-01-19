import { Router } from "express";
import { loginAdmin, registerAdmin } from "../controllers/admin.controller";

const router = Router();

router.route("/").get((req, res) => {
  console.log(req);
  res.send("Hello World");
});

router.route("/login").post(loginAdmin);

router.route("/register").post(registerAdmin);

export default router;
