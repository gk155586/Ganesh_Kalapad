const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Clearing delivery partner history...");
  
  // 1. Reset Delivery Partner Stats
  await prisma.deliveryPartner.updateMany({
    data: {
      totalOrders: 0,
      totalEarnings: 0,
      points: 0
    }
  });
  console.log("Delivery Partner stats reset.");

  // 2. Hide all past orders that were assigned to delivery partners
  const result = await prisma.order.updateMany({
    where: {
      deliveryPartnerId: { not: null },
      status: { in: ["DELIVERED", "CANCELLED"] }
    },
    data: {
      isHidden: true
    }
  });
  console.log(`Hid ${result.count} past orders.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
