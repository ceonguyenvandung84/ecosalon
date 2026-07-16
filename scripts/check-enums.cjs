const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const [levels, videoProviders, paymentMethods, txStatuses, actions, entities] = await Promise.all([
    prisma.$queryRawUnsafe(`SELECT DISTINCT level FROM "Course" ORDER BY level`),
    prisma.$queryRawUnsafe(`SELECT DISTINCT "videoProvider" FROM "Lesson" ORDER BY "videoProvider"`),
    prisma.$queryRawUnsafe(`SELECT DISTINCT "paymentMethod" FROM "Order" ORDER BY "paymentMethod"`),
    prisma.$queryRawUnsafe(`SELECT DISTINCT status FROM "PaymentTransaction" ORDER BY status`),
    prisma.$queryRawUnsafe(`SELECT DISTINCT action FROM "AdminActivity" ORDER BY action`),
    prisma.$queryRawUnsafe(`SELECT DISTINCT entity FROM "AdminActivity" ORDER BY entity`),
  ]);

  console.log("=== Course.level ===");
  console.log(JSON.stringify(levels, null, 2));
  console.log("=== Lesson.videoProvider ===");
  console.log(JSON.stringify(videoProviders, null, 2));
  console.log("=== Order.paymentMethod ===");
  console.log(JSON.stringify(paymentMethods, null, 2));
  console.log("=== PaymentTransaction.status ===");
  console.log(JSON.stringify(txStatuses, null, 2));
  console.log("=== AdminActivity.action ===");
  console.log(JSON.stringify(actions, null, 2));
  console.log("=== AdminActivity.entity ===");
  console.log(JSON.stringify(entities, null, 2));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
