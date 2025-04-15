import dotenv from "dotenv";
import { app } from "./app";
import connectDB from "./db/index";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app
      .listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}`);
      })
      .on("error", (err) => {
        console.error(err);
        process.exit(1); // ⬅️ This line ensures process exits on port conflict
      });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
