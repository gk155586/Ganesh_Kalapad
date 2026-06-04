const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.user.updateMany({
    where: { role: 'DELIVERY_PARTNER' },
    data: { role: 'DELIVERY' }
  });
  console.log(`Updated ${updated.count} users to role 'DELIVERY'`);
  
  const partners = await prisma.deliveryPartner.findMany();
  console.log(`Current Delivery Partners: ${partners.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
