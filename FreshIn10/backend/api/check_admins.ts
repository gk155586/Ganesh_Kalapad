import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" }
  });
  console.log("All Admins (Sorted by CreatedAt):");
  users.forEach((u, i) => {
    console.log(`${i + 1}. Email: ${u.email}, CreatedAt: ${u.createdAt}, ID: ${u.id}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
