import { z } from "zod";

export const updateProfileSchema = {
  body: z.object({
    name: z.string().trim().min(3, "Tên phải có ít nhất 3 ký tự").optional(),
    phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/, "Số điện thoại không hợp lệ").optional().or(z.literal("")),
    avatar: z.string().url("Đường dẫn ảnh đại diện không hợp lệ").optional().or(z.literal("")),
  }),
};

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(6, "Mật khẩu hiện tại phải từ 6 ký tự"),
    newPassword: z.string().min(6, "Mật khẩu mới phải từ 6 ký tự"),
  }),
};

export const addressSchema = {
  body: z.object({
    receiverName: z.string().trim().min(2, "Tên người nhận phải từ 2 ký tự"),
    phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/, "Số điện thoại người nhận không hợp lệ"),
    addressDetail: z.string().trim().min(5, "Địa chỉ chi tiết phải từ 5 ký tự"),
    isDefault: z.boolean().optional().default(false),
  }),
};
