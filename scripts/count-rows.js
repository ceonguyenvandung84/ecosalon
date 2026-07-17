const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const checks = {
    user: () => p.user.count(),
    product: () => p.product.count(),
    course: () => p.course.count(),
    category: () => p.category.count(),
    setting: () => p.setting.count(),
    order: () => p.order.count(),
    enrollment: () => p.enrollment.count(),
    blogPost: () => p.blogPost.count(),
    brand: () => p.brand.count(),
    review: () => p.review.count(),
  };
  for (const [name, fn] of Object.entries(checks)) {
    try {
      const c = await fn();
      console.log(name, c);
    } catch (e) {
      console.log(name, "ERR", String(e.message).slice(0, 80));
    }
  }
  process.exit(0);
})();
