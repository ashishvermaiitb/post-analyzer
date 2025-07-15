import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Helper function to disconnect Prisma (useful for serverless)
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

// Helper function to check database connection
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { success: true, message: "Database connection successful" };
  } catch (error) {
    console.error("Database connection failed:", error);
    return {
      success: false,
      message: "Database connection failed",
      error: error.message,
    };
  }
}

export default prisma;
