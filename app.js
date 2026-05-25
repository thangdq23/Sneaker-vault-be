import cors from "cors";
import express from "express";
import router from "./src/routes/index.js";
import connectDB from "./src/shared/configs/db.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", router);
app.get("/", (req, res) => {
  res.json({
    message: "Sneaker Vault API is running.",
  });
});

connectDB();

app.listen(3000, () => {
  console.log(`Server running on http://localhost:${3000}`);
});

export default app;
