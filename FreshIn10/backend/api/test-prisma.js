const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking if prisma.notification exists...");
  if (prisma.notification) {
    console.log("prisma.notification exists.");
  } else {
    console.log("prisma.notification DOES NOT EXIST!");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
