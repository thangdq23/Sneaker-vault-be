import User from "./user.model.js";
import Order from "../order/order.model.js";
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

    if (user.isActive === false) {
      return createError(res, 403, "Tài khoản của bạn đã bị khóa. Không thể cập nhật thông tin.");
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

    if (user.isActive === false) {
      return createError(res, 403, "Tài khoản của bạn đã bị khóa. Không thể thực hiện hành động này.");
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

    if (user.isActive === false) {
      return createError(res, 403, "Tài khoản của bạn đã bị khóa. Không thể thực hiện hành động này.");
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

    if (user.isActive === false) {
      return createError(res, 403, "Tài khoản của bạn đã bị khóa. Không thể thực hiện hành động này.");
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

    if (user.isActive === false) {
      return createError(res, 403, "Tài khoản của bạn đã bị khóa. Không thể thực hiện hành động này.");
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

    if (user.isActive === false) {
      return createError(res, 403, "Tài khoản của bạn đã bị khóa. Không thể thực hiện hành động này.");
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
    const { page = 1, limit = 10, search } = req.query;
    const queryConditions = {};

    if (search) {
      const searchRegex = new RegExp(search, "i");
      queryConditions.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(queryConditions);
    const users = await User.find(queryConditions)
      .select("-password")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    res.json({
      data: users,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return createError(res, 404, "User not found.");
    }

    const orders = await Order.find({ user: id })
      .populate("items.product", "name price images brand sku")
      .sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const totalSpent = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      user,
      totalOrders,
      totalSpent,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return createError(res, 400, "Bạn không thể tự khóa tài khoản của chính mình.");
    }

    const user = await User.findById(id);
    if (!user) {
      return createError(res, 404, "User not found.");
    }

    user.isActive = false;
    await user.save();

    res.json({ message: "Khóa tài khoản người dùng thành công.", user });
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return createError(res, 404, "User not found.");
    }

    user.isActive = true;
    await user.save();

    res.json({ message: "Mở khóa tài khoản người dùng thành công.", user });
  } catch (error) {
    next(error);
  }
};
