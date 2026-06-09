import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../user/user.model.js";
import { configEnv } from "../../shared/configs/configenv.js";
import createError from "../../shared/utils/createError.js";

const JWT_SECRET = configEnv.JWT_SECRET;
const JWT_EXPIRY = configEnv.JWT_EXPIRY;

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return createError(res, 409, "Email already registered.");
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
    });

    res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        phone: user.phone || "",
        addresses: user.addresses || [],
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return createError(res, 401, "Invalid email or password.");
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return createError(res, 401, "Invalid email or password.");
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
    });

    res.json({
      message: "Login successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        phone: user.phone || "",
        addresses: user.addresses || [],
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};
