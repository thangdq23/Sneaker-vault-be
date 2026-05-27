import cors from "cors";
import express from "express";
import connectDB from "./shared/configs/db.js";
import router from "./routes/index.js";
import { configEnv } from "./shared/configs/configenv.js";

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

app.listen(configEnv.PORT, () => {
  console.log(`Server running on http://localhost:${configEnv.PORT}`);
});

export default app;
