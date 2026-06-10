import express from "express";
import {
  getProfile,
  updateProfile,
  getAllUsers,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  uploadAvatar,
  getUserById,
  blockUser,
  unblockUser,
} from "./user.controller.js";
import { authenticateToken, authorizeRole } from "../../shared/middlewares/auth.middleware.js";
import { validateRequest } from "../../shared/middlewares/validate.middleware.js";
import { upload } from "../../shared/middlewares/upload.middleware.js";
import {
  updateProfileSchema,
  changePasswordSchema,
  addressSchema,
} from "./user.schema.js";

const routerUser = express.Router();

routerUser.get("/me", authenticateToken, getProfile);
routerUser.put(
  "/me",
  authenticateToken,
  validateRequest(updateProfileSchema),
  updateProfile,
);
routerUser.put(
  "/me/change-password",
  authenticateToken,
  validateRequest(changePasswordSchema),
  changePassword,
);
routerUser.post(
  "/me/addresses",
  authenticateToken,
  validateRequest(addressSchema),
  addAddress,
);
routerUser.put(
  "/me/addresses/:addressId",
  authenticateToken,
  validateRequest(addressSchema),
  updateAddress,
);
routerUser.delete(
  "/me/addresses/:addressId",
  authenticateToken,
  deleteAddress,
);
routerUser.patch(
  "/me/addresses/:addressId/default",
  authenticateToken,
  setDefaultAddress,
);
routerUser.post(
  "/me/avatar",
  authenticateToken,
  upload.single("avatar"),
  uploadAvatar,
);
routerUser.get("/", authenticateToken, authorizeRole("admin"), getAllUsers);
routerUser.get("/:id", authenticateToken, authorizeRole("admin"), getUserById);
routerUser.patch("/:id/block", authenticateToken, authorizeRole("admin"), blockUser);
routerUser.patch("/:id/unblock", authenticateToken, authorizeRole("admin"), unblockUser);

export default routerUser;
