import { slugify } from "./utils";

// Generate a URL-friendly slug from a title, with a short random suffix to
// avoid collisions. Vietnamese-aware via slugify().
export function makeSlug(title: string): string {
  const base = slugify(title) || "bai-viet";
  const rand = Math.random().toString(36).slice(2, 7);
  return `${base}-${rand}`;
}

// Split free-form text content into paragraphs for rendering.
export function contentToParagraphs(content: string): string[] {
  return (content ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// Default forum categories used for seeding.
export const DEFAULT_FORUM_CATEGORIES = [
  { name: "Thảo luận chung", slug: "thao-luan-chung", icon: "MessagesSquare", description: "Trao đổi mọi chủ đề về nghề tóc, làm đẹp", order: 1 },
  { name: "Kỹ thuật & Tay nghề", slug: "ky-thuat-tay-nghe", icon: "Scissors", description: "Chia sẻ kỹ thuật cắt, uốn, nhuộm, chăm sóc tóc", order: 2 },
  { name: "Sản phẩm & Mỹ phẩm", slug: "san-pham-my-pham", icon: "Sparkles", description: "Đánh giá, hỏi đáp về sản phẩm và mỹ phẩm", order: 3 },
  { name: "Kinh doanh salon", slug: "kinh-doanh-salon", icon: "Store", description: "Quản lý, marketing và vận hành salon", order: 4 },
  { name: "Hỏi đáp khóa học", slug: "hoi-dap-khoa-hoc", icon: "GraduationCap", description: "Thắc mắc về các khóa học trên hệ thống", order: 5 },
];
