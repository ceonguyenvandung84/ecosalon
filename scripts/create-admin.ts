import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: "admin@salonweb.com" } });
  if (existing) {
    console.log("Admin user already exists:", existing.email);
    return;
  }
  const hash = await bcrypt.hash("admin123", 12);
  const user = await prisma.user.create({
    data: {
      email: "admin@salonweb.com",
      password: hash,
      fullName: "Admin",
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log("Created admin user:", user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
