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

app.get("/", (req, res) => {
  res.send("Hello World");
});

// need to work on middleware as well for authentication and routes to work properly

// API end point example for the time begin
// http://localhost:8000/api/v1/users/register

export { app };
