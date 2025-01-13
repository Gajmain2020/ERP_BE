import { Response } from "express";

export const sendResponse = (
  res: Response,
  status: number,
  message: string,
  success: boolean,
  data?: object
) => {
  res.status(status).json({ message, success, ...data });
};

// Utility function for consistent error logging
export function LogOutError(error: Error): void {
  console.error(`
    #################################################################
    ERROR MESSAGE: ${error.message}
    ***************************************************************
    ERROR DETAILS: ${error}
    #################################################################
    `);
}

export const reqString = {
  type: String,
  required: true,
};
