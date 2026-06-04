import { prisma } from "../src/lib/prisma";

async function check() {
  try {
    const userCount = await prisma.user.count();
    console.log(`Connection successful. User count: ${userCount}`);
    process.exit(0);
  } catch (err) {
    console.error("Connection failed:", err);
    process.exit(1);
  }
}

check();
