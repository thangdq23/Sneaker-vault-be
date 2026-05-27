import mongoose from "mongoose";
import { configEnv } from "./configenv.js";

const connectDB = async () => {
  try {
    await mongoose.connect(configEnv.MONGO_URI);
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export default connectDB;
