import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const pdfFileSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  pdfUrl: {
    type: String,
    required: true,
  },
});

const PDF = mongoose.model("PDF", pdfFileSchema);

const Image = mongoose.model("Image", imageSchema);

export { PDF, Image };
