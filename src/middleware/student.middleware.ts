import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// Extend the Request interface to include the user property
declare module "express" {
  interface Request {
    user?: JwtPayload;
  }
}

interface JwtPayload {
  id: string; // User ID or student ID
  email: string;
  name: string;
}

export const authenticateStudentToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    res.status(403).json({
      message: "Access denied. No token provided.",
      success: false,
    });
    return;
  }

  interface DecodedToken extends JwtPayload {
    iat: number;
    exp: number;
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET as string,
    (err: jwt.VerifyErrors | null, decoded: object | undefined) => {
      if (err) {
        console.log("here");
        return res.status(401).json({
          message: "Invalid or expired token.",
          action: "logout",
          success: false,
        });
      }

      // Attach the decoded user info to the request object
      req.user = decoded as DecodedToken;
      next();
    }
  );
};

export const checkAllAttributesToAddDetails = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requiredFields = [
      "dob",
      "bloodGroup",
      "gender",
      "nationality",
      "studentMobileNumber",
      "guardianDetails",
      "aadharNumber",
      "category",
      "permanentAddress",
      "currentAddress",
      "admissionNumber",
      "abcId",
      // "profilePhoto",
      "emergencyContact",
    ];

    const missingFields = requiredFields.filter(
      (field) => !req.body.details[field]
    );

    console.log(missingFields);

    if (missingFields.length) {
      res.status(400).json({
        message: "Some required fields are missing.",
        success: false,
      });
      return;
    }

    next();
  } catch (error) {
    res.status(403).json({
      message: "Invalid or expired token.",
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error.",
    });
    return;
  }
};
