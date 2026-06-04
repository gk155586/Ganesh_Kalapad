const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.review.count();
  console.log('Reviews count:', count);
  const drCount = await prisma.deliveryRating.count();
  console.log('Delivery Ratings count:', drCount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
