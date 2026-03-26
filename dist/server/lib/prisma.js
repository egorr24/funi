var _a;
import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis;
export const prisma = (_a = globalForPrisma.prisma) !== null && _a !== void 0 ? _a : new PrismaClient({
    log: ["query", "warn", "error"],
});
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
