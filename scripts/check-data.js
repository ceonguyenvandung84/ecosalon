require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  try {
    const u = await p.user.count();
    const pr = await p.product.count();
    const c = await p.course.count();
    const cat = await p.category.count();
    console.log("user=", u, "product=", pr, "course=", c, "category=", cat);
  } catch (e) {
    console.log("ERR", String(e.message).slice(0, 120));
  }
  process.exit(0);
})();
