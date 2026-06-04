const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Deleting all reviews and ratings...");
  
  const r1 = await prisma.review.deleteMany();
  console.log(`Deleted ${r1.count} product reviews.`);

  const r2 = await prisma.deliveryRating.deleteMany();
  console.log(`Deleted ${r2.count} delivery ratings.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
