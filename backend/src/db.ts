import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

const globalForPrisma = global as unknown as { __prisma?: PrismaClient };

export const prisma =
  globalForPrisma.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}
