const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found");
    return;
  }
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'super-secret-jwt-key', { expiresIn: '1d' });
  console.log("TOKEN:", token);
}

main().catch(console.error).finally(() => prisma.$disconnect());
