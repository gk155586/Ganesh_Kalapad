const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const partners = await prisma.deliveryPartner.findMany({ include: { user: true } });
  console.log("Partners:", JSON.stringify(partners, null, 2));
  const orders = await prisma.order.findMany({ select: { id: true, status: true, deliveryPartnerId: true, paymentMethod: true }});
  console.log("Orders:", orders);
}
run().finally(() => prisma.$disconnect());
