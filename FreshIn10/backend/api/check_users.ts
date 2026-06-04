import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    take: 10
  });
  console.log("First 10 Users (Sorted by CreatedAt):");
  users.forEach((u, i) => {
    console.log(`${i + 1}. Email: ${u.email}, Role: ${u.role}, CreatedAt: ${u.createdAt}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
