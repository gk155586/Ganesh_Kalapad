const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const pexelsData = {
  "Apple": "https://images.pexels.com/photos/28486832/pexels-photo-28486832.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "Potato": "https://images.pexels.com/photos/29509701/pexels-photo-29509701.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "Onion": "https://images.pexels.com/photos/4163411/pexels-photo-4163411.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "Tomato": "https://images.pexels.com/photos/19852143/pexels-photo-19852143.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "Cabbage": "https://images.pexels.com/photos/36771049/pexels-photo-36771049.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "Banana": "https://images.pexels.com/photos/16214622/pexels-photo-16214622.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "Pomegranate": "https://images.pexels.com/photos/7957001/pexels-photo-7957001.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "Carrot": "https://images.pexels.com/photos/34936603/pexels-photo-34936603.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "Coriander": "https://images.pexels.com/photos/606540/pexels-photo-606540.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "Orange": "https://images.pexels.com/photos/30925637/pexels-photo-30925637.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
};

async function main() {
  const products = await prisma.product.findMany();
  
  for (const product of products) {
    for (const [key, url] of Object.entries(pexelsData)) {
      if (product.name.toLowerCase().includes(key.toLowerCase())) {
        await prisma.product.update({
          where: { id: product.id },
          data: { images: JSON.stringify([url]) }
        });
        console.log(`Updated images for ${product.name}`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
