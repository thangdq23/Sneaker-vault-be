import express from "express";
import { register, login } from "./auth.controller.js";
import { validateRequest } from "../../shared/middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "./auth.schema.js";

const routerAuth = express.Router();

routerAuth.post("/register", validateRequest(registerSchema), register);
routerAuth.post("/login", validateRequest(loginSchema), login);

export default routerAuth;
