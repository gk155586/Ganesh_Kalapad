const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const fruitImages = [
  "https://images.pexels.com/photos/28486832/pexels-photo-28486832.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/16214622/pexels-photo-16214622.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/7957001/pexels-photo-7957001.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/30925637/pexels-photo-30925637.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/235294/pexels-photo-235294.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/1352245/pexels-photo-1352245.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=400"
];

const vegImages = [
  "https://images.pexels.com/photos/29509701/pexels-photo-29509701.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/4163411/pexels-photo-4163411.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/19852143/pexels-photo-19852143.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/36771049/pexels-photo-36771049.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/34936603/pexels-photo-34936603.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/606540/pexels-photo-606540.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/2286777/pexels-photo-2286777.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/2329440/pexels-photo-2329440.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/1443867/pexels-photo-1443867.jpeg?auto=compress&cs=tinysrgb&w=400"
];

const FRUIT_CAT_ID = "cmok0vpw300077u2pi2uq4e6s"; // Fruits
const VEG_CAT_ID = "cmok0vpdi00067u2p5zydjsh7";   // Vegetables

async function main() {
  console.log("Seeding 500 fruits and 500 vegetables...");
  
  // Create Fruits
  for (let i = 1; i <= 500; i++) {
    const slug = `fresh-fruit-variant-${i}-${Math.random().toString(36).substring(2, 6)}`;
    const price = Math.floor(Math.random() * 200) + 50;
    const mrp = price + Math.floor(Math.random() * 50);
    const image = fruitImages[i % fruitImages.length];

    const prod = await prisma.product.create({
      data: {
        name: `Premium Fresh Fruit #${i}`,
        slug,
        price,
        mrp,
        unit: "1 kg",
        images: JSON.stringify([image]),
        tags: JSON.stringify(["fruits", "fresh"]),
        categoryId: FRUIT_CAT_ID,
        isTrending: i <= 5, // make some trending
        isFeatured: i % 10 === 0,
      }
    });

    await prisma.inventory.create({
      data: {
        productId: prod.id,
        stock: Math.floor(Math.random() * 500) + 100,
        lowStockAt: 20
      }
    });
  }

  // Create Veggies
  for (let i = 1; i <= 500; i++) {
    const slug = `fresh-veg-variant-${i}-${Math.random().toString(36).substring(2, 6)}`;
    const price = Math.floor(Math.random() * 100) + 20;
    const mrp = price + Math.floor(Math.random() * 30);
    const image = vegImages[i % vegImages.length];

    const prod = await prisma.product.create({
      data: {
        name: `Organic Fresh Vegetable #${i}`,
        slug,
        price,
        mrp,
        unit: "1 kg",
        images: JSON.stringify([image]),
        tags: JSON.stringify(["vegetables", "fresh"]),
        categoryId: VEG_CAT_ID,
        isTrending: i <= 5,
        isFeatured: i % 10 === 0,
      }
    });

    await prisma.inventory.create({
      data: {
        productId: prod.id,
        stock: Math.floor(Math.random() * 500) + 100,
        lowStockAt: 20
      }
    });
  }

  console.log("Success! 1000 items loaded successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
