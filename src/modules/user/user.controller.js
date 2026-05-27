import User from "./user.model.js";
import createError from "../../shared/utils/createError.js";
import { queryBuilder } from "../../shared/utils/queryBuilder.js";

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return createError(res, 404, "User not found.");
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return createError(res, 404, "User not found.");
    }

    if (name) user.name = name;
    await user.save();

    res.json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const result = await queryBuilder(User, {
      ...req.query,
      searchFields: ["name", "email"],
    });

    if (result.data) {
      result.data = result.data.map((user) => {
        const u = user.toObject();
        delete u.password;
        return u;
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};
