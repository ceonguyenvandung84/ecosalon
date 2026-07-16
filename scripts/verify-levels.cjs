const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.$queryRawUnsafe(`SELECT level, COUNT(*)::int as count FROM "Course" GROUP BY level ORDER BY level`).then(rows => {
  console.log(JSON.stringify(rows, null, 2));
  return prisma.$disconnect();
}).catch(e => { console.error(e); process.exit(1); });
