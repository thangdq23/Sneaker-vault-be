import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./auth.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "sneaker-vault-secret";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

const fullNameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[\s'-][A-Za-zÀ-ÖØ-öø-ÿ]+)*\s*$/;
// Basic-but-reasonable email regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
// Password: 6-20 chars, at least 1 uppercase, 1 lowercase, 1 number (no spaces)
const passwordRegex = /^(?=.{6,20}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?!.*\s).+$/;

export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 3 || !fullNameRegex.test(trimmedName)) {
      return res.status(400).json({
        error:
          "Full name must be at least 3 characters and contain only letters (may include spaces, hyphens or apostrophes).",
      });
    }

    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    if (password.length < 6 || !passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 6 characters and include at least 1 uppercase letter, 1 lowercase letter, and 1 number.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
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
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password." });
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
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed." });
  }
};
