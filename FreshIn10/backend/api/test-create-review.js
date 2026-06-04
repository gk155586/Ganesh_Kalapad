const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
  const product = await prisma.product.findFirst();
  
  if (user && product) {
    await prisma.review.upsert({
      where: { userId_productId: { userId: user.id, productId: product.id } },
      create: {
        userId: user.id,
        productId: product.id,
        rating: 5,
        comment: 'Great product!'
      },
      update: {}
    });
    console.log('Created fake review');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
