import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("here", process.env.MONGODB_URI);
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}`
    );
    console.log(
      `\n🔗 MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection FAILED ", error.message);
    process.exit(1);
  }
};

export default connectDB;
