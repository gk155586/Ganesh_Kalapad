const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: { isHidden: false },
    select: { id: true, orderNumber: true, status: true, deliveryPartnerId: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  console.log('\n=== Recent Orders ===');
  orders.forEach(o => {
    console.log(`${o.orderNumber} | status: ${o.status} | partnerId: ${o.deliveryPartnerId || 'UNASSIGNED'}`);
  });
  
  console.log('\n=== Status Summary ===');
  const grouped = {};
  orders.forEach(o => {
    grouped[o.status] = (grouped[o.status] || 0) + 1;
  });
  console.log(grouped);
}

main().catch(console.error).finally(() => prisma.$disconnect());
