import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL || "test@test.com";
  const password = process.env.SEED_PASSWORD || "test1234";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`الحساب موجود مسبقاً: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, passwordHash },
  });

  console.log("تم إنشاء الحساب الثابت:");
  console.log(`  البريد: ${email}`);
  console.log(`  كلمة السر: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
