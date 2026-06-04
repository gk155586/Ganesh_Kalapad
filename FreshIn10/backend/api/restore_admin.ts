import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const email = "admin@gmail.com";
  const pass = "admin@123";
  const hashed = await bcrypt.hash(pass, 12);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashed,
      role: "ADMIN",
      createdAt: new Date("2020-01-01T00:00:00Z")
    },
    create: {
      email,
      name: "Main Admin",
      password: hashed,
      role: "ADMIN",
      createdAt: new Date("2020-01-01T00:00:00Z")
    }
  });

  console.log(`Main Admin restored: ${email} / ${pass}`);
  console.log(`Created at: ${user.createdAt}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
