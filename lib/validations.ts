import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Email không hợp lệ").max(255),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").max(128),
  fullName: z.string().min(1, "Vui lòng nhập họ tên").max(100),
  refCode: z.string().max(50).optional().default(""),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().default(""),
  courseId: z.string().optional(),
  productId: z.string().optional(),
}).refine((d) => d.courseId || d.productId, { message: "Thiếu đối tượng đánh giá" });

export const forumThreadSchema = z.object({
  title: z.string().min(5, "Tiêu đề quá ngắn").max(200),
  content: z.string().min(1, "Vui lòng nhập nội dung").max(10000),
  categoryId: z.string().min(1, "Vui lòng chọn chuyên mục"),
});

export const forumReplySchema = z.object({
  content: z.string().min(1, "Vui lòng nhập nội dung").max(5000),
});

export const blogCommentSchema = z.object({
  content: z.string().min(1, "Vui lòng nhập nội dung").max(2000),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
  avatarPath: z.string().max(500).optional(),
});

export const courseQuestionSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề").max(200),
  content: z.string().min(1, "Vui lòng nhập nội dung").max(5000),
});

export const courseAnswerSchema = z.object({
  content: z.string().min(1, "Vui lòng nhập nội dung").max(5000),
});