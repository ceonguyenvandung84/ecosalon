import { describe, it, expect } from "vitest";
import { signupSchema, reviewSchema, forumThreadSchema, forumReplySchema } from "@/lib/validations";

describe("signupSchema", () => {
  it("accepts valid input", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "123456",
      fullName: "Nguyen Van A",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = signupSchema.safeParse({
      email: "not-an-email",
      password: "123456",
      fullName: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "12345",
      fullName: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "123456",
      fullName: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("reviewSchema", () => {
  it("accepts valid course review", () => {
    const result = reviewSchema.safeParse({ rating: 5, courseId: "course-1" });
    expect(result.success).toBe(true);
  });

  it("accepts valid product review with comment", () => {
    const result = reviewSchema.safeParse({ rating: 4, productId: "product-1", comment: "Good product" });
    expect(result.success).toBe(true);
  });

  it("rejects rating out of range", () => {
    const r1 = reviewSchema.safeParse({ rating: 0, courseId: "c1" });
    expect(r1.success).toBe(false);
    const r2 = reviewSchema.safeParse({ rating: 6, courseId: "c1" });
    expect(r2.success).toBe(false);
  });

  it("rejects without courseId or productId", () => {
    const result = reviewSchema.safeParse({ rating: 3 });
    expect(result.success).toBe(false);
  });
});

describe("forumThreadSchema", () => {
  it("accepts valid thread", () => {
    const result = forumThreadSchema.safeParse({
      title: "How to style curly hair?",
      content: "I need advice on curly hair styling.",
      categoryId: "cat-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short title", () => {
    const result = forumThreadSchema.safeParse({
      title: "Hi",
      content: "Some content",
      categoryId: "cat-1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = forumThreadSchema.safeParse({
      title: "A proper title",
      content: "",
      categoryId: "cat-1",
    });
    expect(result.success).toBe(false);
  });
});

describe("forumReplySchema", () => {
  it("accepts valid reply", () => {
    const result = forumReplySchema.safeParse({ content: "I agree with this!" });
    expect(result.success).toBe(true);
  });

  it("rejects empty reply", () => {
    const result = forumReplySchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });
});