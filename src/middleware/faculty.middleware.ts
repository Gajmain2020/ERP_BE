import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

declare module "express" {
  interface Request {
    user?: JwtPayload;
  }
}

interface JwtPayload {
  id: string; // User ID or student ID
  email: string;
}

export const authenticateFacultyToken = (
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
