import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanProducts() {
  console.log("🔍 Searching for products to delete...");
  
  const keywords = ["Organic", "Fresh", "Vegetable", "Fruit"];
  
  const productsToDelete = await prisma.product.findMany({
    where: {
      OR: keywords.map(k => ({
        name: { contains: k, mode: 'insensitive' }
      }))
    },
    select: { id: true, name: true }
  });

  console.log(`Found ${productsToDelete.length} products to delete.`);
  
  if (productsToDelete.length > 0) {
    const ids = productsToDelete.map(p => p.id);
    
    // Delete related records first to avoid foreign key violations
    await prisma.inventory.deleteMany({ where: { productId: { in: ids } } });
    await prisma.cartItem.deleteMany({ where: { productId: { in: ids } } });
    await prisma.wishlist.deleteMany({ where: { productId: { in: ids } } });
    await prisma.review.deleteMany({ where: { productId: { in: ids } } });
    await prisma.orderItem.deleteMany({ where: { productId: { in: ids } } });

    const result = await prisma.product.deleteMany({
      where: { id: { in: ids } }
    });
    
    console.log(`✅ Successfully deleted ${result.count} products.`);
  } else {
    console.log("No matching products found.");
  }
}

cleanProducts()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
