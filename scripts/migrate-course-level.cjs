const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Step 1: Update existing data to new enum-compatible values
  const result = await prisma.$executeRawUnsafe(`
    UPDATE "Course"
    SET level = CASE level
      WHEN 'Cơ bản' THEN 'BEGINNER'
      WHEN 'Trung cấp' THEN 'INTERMEDIATE'
      WHEN 'Nâng cao' THEN 'ADVANCED'
      ELSE 'BEGINNER'
    END
    WHERE level NOT IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS')
  `);
  console.log(`Updated ${result} rows`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
