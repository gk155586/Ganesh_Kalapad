const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findFirst({
    where: { orderNumber: 'FI10-MOJG8KD5-YUHS' }
  });

  if (order) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CONFIRMED' }
    });
    console.log(`Updated order ${order.orderNumber} status to CONFIRMED.`);
  } else {
    console.log('Order not found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
