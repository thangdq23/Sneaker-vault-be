import { z } from "zod";

const passwordRegex = /^(?=.{6,20}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?!.*\s).+$/;
const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[\s'-][A-Za-zÀ-ÖØ-öø-ÿ]+)*\s*$/;

export const registerSchema = {
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(3, "Full name must be at least 3 characters")
        .regex(
          nameRegex,
          "Full name must contain only letters (may include spaces, hyphens or apostrophes)",
        ),
      email: z.string().trim().email("Invalid email format"),
      password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(20, "Password must be at most 20 characters")
        .regex(
          passwordRegex,
          "Password must include at least 1 uppercase letter, 1 lowercase letter, and 1 number",
        ),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().trim().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().trim().email("Định dạng email không hợp lệ"),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1, "Token reset mật khẩu là bắt buộc"),
    newPassword: z
      .string()
      .min(6, "Mật khẩu phải từ 6 ký tự")
      .max(20, "Mật khẩu tối đa 20 ký tự")
      .regex(
        /^(?=.{6,20}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?!.*\s).+$/,
        "Mật khẩu phải bao gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 số"
      ),
  }),
};
