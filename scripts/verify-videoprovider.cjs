const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.$queryRawUnsafe(`SELECT "videoProvider", COUNT(*)::int as count FROM "Lesson" GROUP BY "videoProvider" ORDER BY "videoProvider"`).then(rows => {
  console.log(JSON.stringify(rows, null, 2));
  return prisma.$disconnect();
}).catch(e => { console.error(e); process.exit(1); });