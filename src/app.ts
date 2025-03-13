import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // Replace with your frontend URL
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"], // Ensure PATCH is allowed
    allowedHeaders: ["Content-Type", "Authorization"], // Explicitly allow headers
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "32kb" }));
app.use(cookieParser());

//! IMPORTING ROUTES FROM DISTINCT FILES
import studentRoutes from "./routes/student.routes";
import facultyRoutes from "./routes/faculty.routes";
import adminRoutes from "./routes/admin.routes";

app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/student", studentRoutes);
app.use("/api/v1/faculty", facultyRoutes);

// import imageUploadRouter from "./controllers/image.controllers";

// // Testing image upload
// app.use("/api/upload", imageUploadRouter);

// API end point example for the time begin
// http://localhost:5500/api/v1/users/register

export { app };
