import mongoose from "mongoose";
import { reqString } from "../utils/utils";

const adminSchema = new mongoose.Schema({
  email: reqString,
  password: reqString,
  name: reqString,
});

const Admin = mongoose.model("Admin", adminSchema);

export { Admin };
