import mongoose from "mongoose";
import { configEnv } from "./configenv.js";
import { migrateProductSizes } from "../utils/migrateProducts.js";

const connectDB = async () => {
  try {
    await mongoose.connect(configEnv.MONGO_URI);
    console.log("MongoDB connected successfully.");
    await migrateProductSizes();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export default connectDB;
