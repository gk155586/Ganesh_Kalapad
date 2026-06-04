const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const deleted = await prisma.user.deleteMany({
    where: { role: 'DELIVERY', email: 'delivery@test.com' } // Assuming this is the test partner
  });
  console.log('Deleted Test Delivery Partner', deleted);
  
  const testPartner2 = await prisma.user.deleteMany({
    where: { name: { contains: 'Test' } }
  });
  console.log('Deleted any users with Test in name', testPartner2);
}
main().catch(console.error).finally(() => prisma.$disconnect());
