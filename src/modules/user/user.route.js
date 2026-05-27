import express from "express";
import { getProfile, updateProfile, getAllUsers } from "./user.controller.js";
import { authenticateToken, authorizeRole } from "../../shared/middlewares/auth.middleware.js";
import { validateRequest } from "../../shared/middlewares/validate.middleware.js";
import { updateProfileSchema } from "./user.schema.js";

const routerUser = express.Router();

routerUser.get("/me", authenticateToken, getProfile);
routerUser.put(
  "/me",
  authenticateToken,
  validateRequest(updateProfileSchema),
  updateProfile,
);
routerUser.get("/", authenticateToken, authorizeRole("admin"), getAllUsers);

export default routerUser;
