const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up order-related data...');
  
  await prisma.orderTracking.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.deliveryRating.deleteMany({});
  await prisma.order.deleteMany({});
  
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
