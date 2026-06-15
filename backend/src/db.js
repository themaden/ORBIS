import { PrismaClient } from "@prisma/client";

// Tek Prisma örneği (dev'de --watch yeniden başlatmalarında çoğalmasın)
const globalForPrisma = globalThis;
export const prisma =
  globalForPrisma.__prisma ?? new PrismaClient();
if (!globalForPrisma.__prisma) globalForPrisma.__prisma = prisma;
