import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from the project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });


const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
