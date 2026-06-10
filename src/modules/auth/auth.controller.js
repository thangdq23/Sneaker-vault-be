import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../user/user.model.js";
import { configEnv } from "../../shared/configs/configenv.js";
import createError from "../../shared/utils/createError.js";
import { sendEmail } from "../../shared/utils/sendEmail.js";

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

    if (user.isActive === false) {
      return createError(res, 403, "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
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

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    const genericResponse = {
      message: "Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi.",
    };

    if (!user) {
      return res.json(genericResponse);
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    const resetUrl = `${configEnv.CLIENT_URL}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #111111; text-align: center;">Yêu cầu đặt lại mật khẩu</h2>
        <p>Xin chào ${user.name},</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>Sneaker Vault</strong>.</p>
        <p>Vui lòng nhấn vào liên kết bên dưới để đặt lại mật khẩu. Liên kết này sẽ hết hạn sau <strong>15 phút</strong>:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #111111; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Đặt lại mật khẩu</a>
        </div>
        <p>Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này. Mật khẩu của bạn vẫn sẽ được giữ nguyên.</p>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #777777; text-align: center;">Đây là email tự động, vui lòng không trả lời email này.</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: "Đặt lại mật khẩu của bạn - Sneaker Vault",
      html,
    });

    res.json(genericResponse);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return createError(res, 400, "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = "";
    user.resetPasswordExpire = null;
    await user.save();

    res.json({
      message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.",
    });
  } catch (error) {
    next(error);
  }
};
