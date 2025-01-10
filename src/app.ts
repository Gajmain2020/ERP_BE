import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "32kb" }));
app.use(cookieParser());

//! IMPORTING ROUTES FROM DISTINCT FILES
import studentRoutes from "./routes/student.routes";

app.use("/api/v1/student", studentRoutes);

import imageUploadRouter from "./controllers/image.controllers";

// Testing image upload
app.use("/api/images", imageUploadRouter);

// API end point example for the time begin
// http://localhost:8000/api/v1/users/register

export { app };
