const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateImages() {
  console.log("Updating product images to local folder...");
  
  const vegCategory = await prisma.category.findFirst({ where: { slug: 'vegetables' } });
  if (vegCategory) {
    const vegProducts = await prisma.product.findMany({ where: { categoryId: vegCategory.id } });
    for (let i = 0; i < vegProducts.length; i++) {
      const p = vegProducts[i];
      const imgPath = `http://localhost:3003/public/images/vegetables/vegetable_${(i % 1000) + 1}.svg`;
      await prisma.product.update({
        where: { id: p.id },
        data: { images: JSON.stringify([imgPath]) }
      });
    }
    console.log(`Updated ${vegProducts.length} vegetables.`);
  }

  const fruitCategory = await prisma.category.findFirst({ where: { slug: 'fruits' } });
  if (fruitCategory) {
    const fruitProducts = await prisma.product.findMany({ where: { categoryId: fruitCategory.id } });
    for (let i = 0; i < fruitProducts.length; i++) {
      const p = fruitProducts[i];
      const imgPath = `http://localhost:3003/public/images/fruits/fruit_${(i % 1000) + 1}.svg`;
      await prisma.product.update({
        where: { id: p.id },
        data: { images: JSON.stringify([imgPath]) }
      });
    }
    console.log(`Updated ${fruitProducts.length} fruits.`);
  }

  console.log("Database images updated successfully!");
}

updateImages()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
