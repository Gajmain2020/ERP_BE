/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import fs from "fs";
import upload from "../utils/multer.config";
import cloudinary from "../utils/cloudinary.config";
import { Image, PDF } from "../models/images.models";

const router = express.Router();

// Route to upload an image to Cloudinary
router.post(
  "/image",
  upload.single("image"),
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { title } = req.body;

      // Validate the input
      if (!title || !(req as any).file) {
        res.status(400).json({
          message: "Title and image are required.",
          success: false,
        });
        return;
      }

      // Upload the image to Cloudinary
      const result = await cloudinary.v2.uploader.upload(
        (req as any).file.path
      );

      // Save the image URL and title in the database
      const newImage = new Image({
        title: title,
        imageUrl: result.secure_url,
      });

      await newImage.save();

      // Remove the file from local storage after uploading
      fs.unlinkSync((req as any).file.path);

      res.status(200).json({
        message: "Image and title uploaded successfully!",
        success: true,
        data: newImage,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        success: false,
        errorMessage: error.message,
      });
    }
  }
);

// Route to upload PDF to Cloudinary
router.post(
  "/pdf",
  upload.single("pdf"),
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { title } = req.body;

      if (!title || !(req as any).file) {
        res.status(400).json({ message: "Title and PDF file are required." });
        return;
      }

      // Upload the PDF to Cloudinary
      const result = await cloudinary.v2.uploader.upload(
        (req as any).file.path,
        { resource_type: "raw" } // Cloudinary will automatically detect if it's a PDF
      );

      // Save the PDF URL and title in the database
      const newPdf = new PDF({
        title,
        pdfUrl: result.secure_url, // Cloudinary provides a secure URL for the uploaded file
      });

      await newPdf.save();
      fs.unlinkSync((req as any).file.path); // Remove the file from local storage after uploading

      res
        .status(200)
        .json({ message: "PDF uploaded successfully!", data: newPdf });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Error uploading PDF.", error: error.message });
    }
  }
);

export default router;
