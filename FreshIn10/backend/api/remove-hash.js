const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Renaming seeded products to remove '#'...");
  const products = await prisma.product.findMany();
  
  let updatedCount = 0;
  for (const product of products) {
    if (product.name.includes('#')) {
      const newName = product.name.replace('#', '');
      await prisma.product.update({
        where: { id: product.id },
        data: { name: newName }
      });
      updatedCount++;
    }
  }
  console.log(`Successfully renamed ${updatedCount} products.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
