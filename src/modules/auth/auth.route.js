import express from "express";
import { register, login, forgotPassword, resetPassword } from "./auth.controller.js";
import { validateRequest } from "../../shared/middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schema.js";

const routerAuth = express.Router();

routerAuth.post("/register", validateRequest(registerSchema), register);
routerAuth.post("/login", validateRequest(loginSchema), login);
routerAuth.post("/forgot-password", validateRequest(forgotPasswordSchema), forgotPassword);
routerAuth.post("/reset-password", validateRequest(resetPasswordSchema), resetPassword);

export default routerAuth;
