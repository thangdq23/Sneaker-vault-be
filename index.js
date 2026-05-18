import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

import productRoutes from "./src/product/product.route.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("MONGO_URI is not defined in environment variables.");
  process.exit(1);
}

mongoose.set("strictQuery", false);
mongoose
  .connect(mongoUri)
  .then(() => console.log("MongoDB connected successfully."))
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

app.use("/api/products", productRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Sneaker Vault API is running." });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(port, () => {
  console.log(`Ứng dụng của bạn đang được chạy trên http://localhost:${port}`);
});
