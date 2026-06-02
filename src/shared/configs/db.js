import mongoose from "mongoose";
import { configEnv } from "./configenv.js";
import { migrateProductSizes, migrateProductSkus } from "../utils/migrateProducts.js";
import { migrateOrderCodes } from "../utils/migrateOrders.js";

const connectDB = async () => {
  try {
    await mongoose.connect(configEnv.MONGO_URI);
    console.log("MongoDB connected successfully.");
    await migrateProductSizes();
    await migrateProductSkus();
    await migrateOrderCodes();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export default connectDB;
