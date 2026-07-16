import { describe, it, expect } from "vitest";
import { sanitize, sanitizePlain } from "@/lib/sanitize";

describe("sanitize", () => {
  it("strips dangerous tags", () => {
    const result = sanitize('<script>alert("xss")</script><p>hello</p>');
    expect(result).not.toContain("<script>");
    expect(result).toContain("hello");
    expect(result).toContain("<p>");
  });

  it("allows safe HTML", () => {
    const result = sanitize("<b>bold</b> <i>italic</i> <a href='https://example.com'>link</a>");
    expect(result).toContain("<b>");
    expect(result).toContain("</b>");
    expect(result).toContain("<a href");
  });

  it("strips event handlers", () => {
    const result = sanitize('<img src="x" onerror="alert(1)">');
    expect(result).not.toContain("onerror");
  });

  it("strips javascript: URLs", () => {
    const result = sanitize('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain("javascript:");
  });

  it("handles empty string", () => {
    expect(sanitize("")).toBe("");
  });

  it("handles plain text unchanged", () => {
    const text = "Hello, this is a normal message with no HTML.";
    expect(sanitize(text)).toBe(text);
  });
});

describe("sanitizePlain", () => {
  it("strips all HTML tags", () => {
    const result = sanitizePlain("<b>bold</b> <script>evil</script> &amp;");
    expect(result).not.toContain("<b>");
    expect(result).not.toContain("</b>");
    expect(result).not.toContain("<script>");
    expect(result).toContain("bold");
    expect(result).toContain("&amp;");
  });

  it("strips everything", () => {
    const result = sanitizePlain("<h1>Title</h1><p>Content</p>");
    expect(result).toBe("TitleContent");
  });
});