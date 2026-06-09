import User from "./user.model.js";
import createError from "../../shared/utils/createError.js";
import { queryBuilder } from "../../shared/utils/queryBuilder.js";
import bcryptjs from "bcryptjs";
import cloudinary from "../../shared/configs/cloudinary.js";

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
    const { name, phone, avatar } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return createError(res, 404, "User not found.");
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return createError(res, 404, "User not found.");
    }

    const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return createError(res, 400, "Mật khẩu hiện tại không chính xác.");
    }

    user.password = await bcryptjs.hash(newPassword, 10);
    await user.save();

    res.json({
      message: "Đổi mật khẩu thành công.",
    });
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const { receiverName, phone, addressDetail, isDefault } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return createError(res, 404, "User not found.");
    }

    const shouldBeDefault = isDefault || user.addresses.length === 0;
    if (shouldBeDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      receiverName,
      phone,
      addressDetail,
      isDefault: shouldBeDefault,
    });

    await user.save();

    res.status(201).json({
      message: "Thêm địa chỉ thành công.",
      addresses: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const { receiverName, phone, addressDetail, isDefault } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return createError(res, 404, "User not found.");
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return createError(res, 404, "Address not found.");
    }

    if (receiverName !== undefined) address.receiverName = receiverName;
    if (phone !== undefined) address.phone = phone;
    if (addressDetail !== undefined) address.addressDetail = addressDetail;

    if (isDefault === true) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
      address.isDefault = true;
    } else if (isDefault === false) {
      address.isDefault = false;
      const hasDefault = user.addresses.some((addr) => addr.isDefault);
      if (!hasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
      }
    }

    await user.save();

    res.json({
      message: "Cập nhật địa chỉ thành công.",
      addresses: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) {
      return createError(res, 404, "User not found.");
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return createError(res, 404, "Address not found.");
    }

    const wasDefault = address.isDefault;
    user.addresses.pull(addressId);

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      message: "Xóa địa chỉ thành công.",
      addresses: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

export const setDefaultAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) {
      return createError(res, 404, "User not found.");
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return createError(res, 404, "Address not found.");
    }

    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === addressId;
    });

    await user.save();

    res.json({
      message: "Đặt làm địa chỉ mặc định thành công.",
      addresses: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không tìm thấy tệp tin nào để tải lên." });
    }

    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "sneaker_vault/avatars" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const url = await uploadPromise;
    res.json({ url });
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
