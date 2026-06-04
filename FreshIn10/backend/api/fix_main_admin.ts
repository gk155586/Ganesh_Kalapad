import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@gmail.com";
  const user = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (user) {
    const oldDate = new Date("2020-01-01T00:00:00Z");
    await prisma.user.update({
      where: { id: user.id },
      data: { createdAt: oldDate }
    });
    console.log(`Successfully set ${adminEmail} as the absolute oldest user (Main Admin).`);
  } else {
    console.log(`User ${adminEmail} not found.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
