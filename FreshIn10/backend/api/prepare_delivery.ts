import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const email = "deliveryfreshin10@gmail.com";
  const pass = "admin@123";
  const hashed = await bcrypt.hash(pass, 12);
  
  await prisma.user.upsert({
    where: { email },
    update: { password: hashed },
    create: {
      email,
      name: "Test Delivery",
      password: hashed,
      role: "DELIVERY_PARTNER"
    }
  });

  console.log(`Delivery account ready: ${email} / ${pass}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
