import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;