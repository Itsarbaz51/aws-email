import { PrismaClient } from '@prisma/client';

const Prisma = new PrismaClient();

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await Prisma.$disconnect();
});

export default Prisma;
