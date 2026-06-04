const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany({ select: { email: true, role: true } }).then(console.log).finally(() => prisma.$disconnect());
