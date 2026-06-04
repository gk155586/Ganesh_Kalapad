import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const usersToDelete = await prisma.user.findMany({
    where: {
      AND: [
        { email: { not: "admin@gmail.com" } },
        { role: { in: ["ADMIN", "SUBADMIN", "DELIVERY", "DELIVERY_PARTNER"] } }
      ]
    }
  });

  console.log("Users to delete:", usersToDelete.length);
  for (const user of usersToDelete) {
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.review.deleteMany({ where: { userId: user.id } });
    await prisma.wishlist.deleteMany({ where: { userId: user.id } });
    await prisma.couponUsage.deleteMany({ where: { userId: user.id } });
    await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
    await prisma.cart.deleteMany({ where: { userId: user.id } });
    await prisma.deliveryPartner.deleteMany({ where: { userId: user.id } });
    await prisma.order.deleteMany({ where: { userId: user.id } });
    await prisma.address.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  console.log("Done");
}
main().finally(() => prisma.$disconnect());
